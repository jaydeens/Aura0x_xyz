import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Bot, User, Sparkles, Cpu, Network } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
      const response = await apiRequest('POST', '/api/chat', { messages: newMessages });
      const data = await response.json();
      return data.message;
    },
    onSuccess: (aiMessage) => {
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get AI response",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    chatMutation.mutate(userMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" data-testid="loading-chat">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg font-bold">Initializing AI connection...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-cyan-600/5 to-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImhleGFnb24iIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTMwIDEwIEw1MCAyMiBMNTAgNDIgTDMwIDU0IEwxMCA0MiBMMTAgMjIgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDE4MywgMjM1LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2hleGFnb24pIi8+PC9zdmc+')] opacity-30"></div>
      </div>
      
      <Navigation />
      
      <main className="relative z-10 pt-20 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30">
                  <Brain className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text" data-testid="heading-ai-chat">
                Dreamz AI Assistant
              </h1>
            </div>
            <p className="text-cyan-200 text-sm sm:text-base font-mono">
              Ask me anything about Web3, crypto, or the Dreamz platform // Neural network online
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-md rounded-3xl border border-cyan-500/20 relative overflow-hidden" data-testid="card-chat-container">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGxpbmUgeDE9IjAiIHkxPSIyMCIgeDI9IjQwIiB5Mj0iMjAiIHN0cm9rZT0icmdiYSgwLCAxODMsIDIzNSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIyMCIgeTE9IjAiIHgyPSIyMCIgeTI9IjQwIiBzdHJva2U9InJnYmEoMCwgMTgzLCAyMzUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50"></div>
            
            <div className="relative p-6">
              {/* Messages */}
              <div className="h-[500px] overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent" data-testid="messages-container">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="mb-6">
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                          <div className="relative p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                            <Cpu className="w-12 h-12 text-cyan-400" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 font-mono">Start a conversation</h3>
                      <p className="text-cyan-200 text-sm font-mono">
                        I'm here to help you learn about Web3, navigate the platform, and answer your questions!
                      </p>
                      <div className="mt-6 grid gap-2">
                        <button
                          onClick={() => {
                            setInput("What are Dreamz Points and how do I earn them?");
                          }}
                          className="text-left px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-200 text-sm transition-colors"
                          data-testid="button-suggestion-1"
                        >
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          What are Dreamz Points and how do I earn them?
                        </button>
                        <button
                          onClick={() => {
                            setInput("Explain SLP trading on CARV SVM Chain");
                          }}
                          className="text-left px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-200 text-sm transition-colors"
                          data-testid="button-suggestion-2"
                        >
                          <Network className="w-4 h-4 inline mr-2" />
                          Explain SLP trading on CARV SVM Chain
                        </button>
                        <button
                          onClick={() => {
                            setInput("How do knowledge battles work?");
                          }}
                          className="text-left px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-200 text-sm transition-colors"
                          data-testid="button-suggestion-3"
                        >
                          <Bot className="w-4 h-4 inline mr-2" />
                          How do knowledge battles work?
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${message.role}-${index}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-cyan-500/30">
                              <Brain className="w-5 h-5 text-cyan-400" />
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 text-white'
                              : 'bg-cyan-900/40 border border-cyan-500/20 text-cyan-100'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center border border-blue-500/30">
                              <User className="w-5 h-5 text-blue-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-cyan-500/30">
                            <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                          </div>
                        </div>
                        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-cyan-900/40 border border-cyan-500/20">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2" data-testid="form-chat-input">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Dreamz AI anything..."
                  className="flex-1 bg-cyan-900/30 border-cyan-500/30 text-white placeholder:text-cyan-300/50 focus:border-cyan-500/50 resize-none font-mono"
                  rows={2}
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || chatMutation.isPending}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6"
                  data-testid="button-send-message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
