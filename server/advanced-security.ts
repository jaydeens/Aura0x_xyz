import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { logSecurityEvent, getClientIP } from './security';

/**
 * Advanced Security Features
 */

export interface SecurityScanResult {
  vulnerabilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: any;
}

/**
 * SQL Injection Detection
 */
export const detectSQLInjection = (input: string): SecurityScanResult | null => {
  // Only detect clear SQL injection patterns, not legitimate content
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b.*\bFROM\b)/i,
    /(\'\s*OR\s*\'\d*\'\s*=\s*\'\d*)/i,
    /(\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b)/i,
    /(\bEXEC\s*\(|\bEXECUTE\s*\()/i,
    /(sleep\(\d+\)|benchmark\(\d+|pg_sleep\(\d+)/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return {
        vulnerabilityLevel: 'HIGH',
        description: 'SQL Injection attempt detected',
        details: { pattern: pattern.source, input: input.substring(0, 100) }
      };
    }
  }
  return null;
};

/**
 * XSS Detection
 */
export const detectXSS = (input: string): SecurityScanResult | null => {
  // Only detect actual script injection attempts
  const xssPatterns = [
    /<script[^>]*>.*?(alert|eval|document\.cookie|window\.location)/gi,
    /javascript:.*?(alert|eval|document)/gi,
    /vbscript:.*?(msgbox|eval)/gi,
    /onload\s*=.*?(alert|eval|document)/gi,
    /onerror\s*=.*?(alert|eval|document)/gi,
    /<iframe[^>]*src\s*=\s*["']javascript:/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return {
        vulnerabilityLevel: 'HIGH',
        description: 'XSS attempt detected',
        details: { pattern: pattern.source, input: input.substring(0, 100) }
      };
    }
  }
  return null;
};

/**
 * LDAP Injection Detection
 */
export const detectLDAPInjection = (input: string): SecurityScanResult | null => {
  const ldapPatterns = [
    /\(\s*\|\s*\(/,
    /\(\s*&\s*\(/,
    /\)\s*\(\s*\|/,
    /\*\)\s*\(/,
    /\(\s*cn\s*=/i,
    /\(\s*uid\s*=/i
  ];

  for (const pattern of ldapPatterns) {
    if (pattern.test(input)) {
      return {
        vulnerabilityLevel: 'MEDIUM',
        description: 'LDAP Injection attempt detected',
        details: { pattern: pattern.source, input: input.substring(0, 100) }
      };
    }
  }
  return null;
};

/**
 * Path Traversal Detection
 */
export const detectPathTraversal = (input: string): SecurityScanResult | null => {
  const pathPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.\%2f/gi,
    /\.\.\%5c/gi
  ];

  for (const pattern of pathPatterns) {
    if (pattern.test(input)) {
      return {
        vulnerabilityLevel: 'HIGH',
        description: 'Path Traversal attempt detected',
        details: { pattern: pattern.source, input: input.substring(0, 100) }
      };
    }
  }
  return null;
};

/**
 * Command Injection Detection
 */
export const detectCommandInjection = (input: string): SecurityScanResult | null => {
  // Only detect actual command injection attempts
  const cmdPatterns = [
    /;\s*(rm\s+-rf|del\s+\/f|format\s+c:|shutdown)/i,
    /\|\s*(cat\s+\/etc\/passwd|type\s+c:\\windows)/i,
    /`(rm|del|cat|wget|curl)\s/i,
    /\$\((rm|del|cat|wget|curl)\s/i,
    /(nc|netcat)\s+\d+\.\d+\.\d+\.\d+/i
  ];

  for (const pattern of cmdPatterns) {
    if (pattern.test(input)) {
      return {
        vulnerabilityLevel: 'CRITICAL',
        description: 'Command Injection attempt detected',
        details: { pattern: pattern.source, input: input.substring(0, 100) }
      };
    }
  }
  return null;
};

/**
 * Comprehensive Vulnerability Scanner
 */
export const scanForVulnerabilities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = req.path;
    
    // Get all input sources, excluding legitimate browser headers
    const inputs = [
      ...Object.values(req.body || {}),
      ...Object.values(req.query || {}),
      ...Object.values(req.params || {})
    ].filter(input => typeof input === 'string' && input.length > 0);

    const detectionFunctions = [
      detectSQLInjection,
      detectXSS,
      detectLDAPInjection,
      detectPathTraversal,
      detectCommandInjection
    ];

    for (const input of inputs) {
      for (const detectFn of detectionFunctions) {
        const result = detectFn(input);
        if (result) {
          // Log to database
          await logVulnerabilityScan(
            'MALICIOUS_INPUT',
            endpoint,
            result.vulnerabilityLevel,
            result.description,
            {
              ...result.details,
              userAgent,
              ipAddress: clientIP,
              sessionId: req.sessionID
            }
          );

          // Log security event
          await logSecurityEvent(
            'VULNERABILITY_DETECTED',
            result.vulnerabilityLevel,
            (req as any).session?.user?.id || null,
            clientIP,
            userAgent,
            endpoint,
            result.details
          );

          // Only block critical threats to prevent false positives
          if (result.vulnerabilityLevel === 'CRITICAL') {
            return res.status(400).json({
              message: 'Malicious input detected',
              error: 'SECURITY_VIOLATION'
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    console.error('Vulnerability scanning error:', error);
    next(); // Continue processing even if scan fails
  }
};

/**
 * IP Allowlist Middleware
 */
export const ipAllowlistMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIP = getClientIP(req);
    
    // Check if IP is in allowlist (for admin endpoints)
    if (req.path.startsWith('/api/admin/')) {
      const isAllowed = await checkIPAllowlist(clientIP);
      if (!isAllowed) {
        await logSecurityEvent(
          'BLOCKED_IP_ACCESS',
          'HIGH',
          null,
          clientIP,
          req.get('User-Agent'),
          req.path,
          { reason: 'IP not in allowlist for admin access' }
        );
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    next();
  } catch (error) {
    console.error('IP allowlist check error:', error);
    next();
  }
};

/**
 * Session Security Tracking
 */
export const trackSessionSecurity = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.session && req.sessionID) {
      const clientIP = getClientIP(req);
      const userAgent = req.get('User-Agent') || 'unknown';
      const userId = req.session.user?.id || null;

      // Update or create session security record
      await updateSessionSecurity(req.sessionID, userId, clientIP, userAgent);
    }

    next();
  } catch (error) {
    console.error('Session security tracking error:', error);
    next();
  }
};

/**
 * Suspicious Activity Detection
 */
export const detectSuspiciousActivity = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = req.session?.user?.id;
    
    // Check for rapid requests from same IP
    const recentRequests = await getRecentRequestsByIP(clientIP, 60); // Last 60 seconds
    if (recentRequests > 100) { // More than 100 requests in 1 minute
      await logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        userId,
        clientIP,
        userAgent,
        req.path,
        { requestCount: recentRequests, timeWindow: '60_seconds' }
      );
    }

    // Check for unusual user agent patterns
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('scanner')) {
      await logSecurityEvent(
        'BOT_DETECTED',
        'MEDIUM',
        userId,
        clientIP,
        userAgent,
        req.path,
        { userAgent }
      );
    }

    // Check for multiple failed login attempts
    if (req.path.includes('/auth/') && res.statusCode >= 400) {
      const failedAttempts = await getFailedLoginAttempts(clientIP, 15); // Last 15 minutes
      if (failedAttempts >= 5) {
        await logSecurityEvent(
          'BRUTE_FORCE_ATTEMPT',
          'CRITICAL',
          userId,
          clientIP,
          userAgent,
          req.path,
          { failedAttempts, timeWindow: '15_minutes' }
        );
      }
    }

    next();
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    next();
  }
};

/**
 * Database helper functions
 */
const logVulnerabilityScan = async (
  scanType: string,
  targetEndpoint: string,
  vulnerabilityLevel: string,
  description: string,
  details: any
): Promise<void> => {
  try {
    const query = `
      INSERT INTO vulnerability_scans (scan_type, target_endpoint, vulnerability_level, description, details)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.execute(query, [scanType, targetEndpoint, vulnerabilityLevel, description, JSON.stringify(details)]);
  } catch (error) {
    console.error('Error logging vulnerability scan:', error);
  }
};

const checkIPAllowlist = async (ipAddress: string): Promise<boolean> => {
  try {
    const query = `
      SELECT COUNT(*) as count FROM ip_allowlist 
      WHERE ip_address = $1 AND is_active = true
    `;
    const result = await db.execute(query, [ipAddress]);
    return parseInt(result.rows[0]?.count || '0') > 0;
  } catch (error) {
    console.error('Error checking IP allowlist:', error);
    return false;
  }
};

const updateSessionSecurity = async (
  sessionId: string,
  userId: string | null,
  ipAddress: string,
  userAgent: string
): Promise<void> => {
  try {
    // First try to update existing record
    const updateQuery = `
      UPDATE session_security 
      SET last_activity = CURRENT_TIMESTAMP, user_id = $2
      WHERE session_id = $1
    `;
    const updateResult = await db.execute(updateQuery, [sessionId, userId]);
    
    // If no rows updated, insert new record
    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      const insertQuery = `
        INSERT INTO session_security (session_id, user_id, ip_address, user_agent, last_activity)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;
      await db.execute(insertQuery, [sessionId, userId, ipAddress, userAgent]);
    }
  } catch (error) {
    console.error('Error updating session security:', error);
  }
};

const getRecentRequestsByIP = async (ipAddress: string, seconds: number): Promise<number> => {
  try {
    const query = `
      SELECT COUNT(*) as count FROM security_events 
      WHERE ip_address = $1 AND timestamp >= NOW() - INTERVAL '${seconds} seconds'
    `;
    const result = await db.execute(query, [ipAddress]);
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('Error getting recent requests:', error);
    return 0;
  }
};

const getFailedLoginAttempts = async (ipAddress: string, minutes: number): Promise<number> => {
  try {
    const query = `
      SELECT COUNT(*) as count FROM security_events 
      WHERE ip_address = $1 
      AND event_type IN ('AUTH_FAILED', 'INVALID_CREDENTIALS') 
      AND timestamp >= NOW() - INTERVAL '${minutes} minutes'
    `;
    const result = await db.execute(query, [ipAddress]);
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('Error getting failed login attempts:', error);
    return 0;
  }
};

/**
 * Security Health Check
 */
export const securityHealthCheck = async (): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: any;
}> => {
  const issues: string[] = [];
  const metrics: any = {};

  try {
    // Check recent security events
    const recentEvents = await db.execute(`
      SELECT event_type, COUNT(*) as count 
      FROM security_events 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY event_type
    `);

    metrics.recentSecurityEvents = recentEvents.rows;

    // Check for critical vulnerabilities
    const criticalVulns = await db.execute(`
      SELECT COUNT(*) as count FROM vulnerability_scans 
      WHERE vulnerability_level = 'CRITICAL' 
      AND scan_timestamp >= NOW() - INTERVAL '24 hours'
      AND resolved = false
    `);

    const criticalCount = parseInt(criticalVulns.rows[0]?.count || '0');
    metrics.criticalVulnerabilities = criticalCount;

    if (criticalCount > 0) {
      issues.push(`${criticalCount} unresolved critical vulnerabilities detected`);
    }

    // Check session security
    const activeSessions = await db.execute(`
      SELECT COUNT(*) as count FROM session_security 
      WHERE session_status = 'ACTIVE' 
      AND last_activity >= NOW() - INTERVAL '1 hour'
    `);

    metrics.activeSessions = parseInt(activeSessions.rows[0]?.count || '0');

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues, metrics };

  } catch (error) {
    console.error('Security health check error:', error);
    return {
      status: 'critical',
      issues: ['Security health check failed'],
      metrics: {}
    };
  }
};