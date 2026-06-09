import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useChatMessages, ChatMessage } from "@/hooks/useChatMessages";
import { useChatPresence } from "@/hooks/useChatPresence";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, MessageSquare, Check, CheckCheck, Paperclip, X, FileText, Loader2, Image as ImageIcon, CalendarDays, Clock4, DollarSign, MapPin, ClipboardList, StickyNote, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import OnlineStatusDot from "./OnlineStatusDot";
import { toast } from "@/hooks/use-toast";

interface ChatRoomProps {
  conversationId: string | null;
  onBack?: () => void;
  isAdmin?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_TYPES = [...IMAGE_TYPES, "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

const ChatRoom = ({ conversationId, onBack, isAdmin }: ChatRoomProps) => {
  const { user } = useAuth();
  const { data: messages = [], isLoading, sendMessage } = useChatMessages(conversationId);
  const { partnerTyping, partnerOnline, setTyping } = useChatPresence(conversationId);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation partner info
  const { data: partner } = useQuery({
    queryKey: ["chat-partner", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("customer_id, provider_id")
        .eq("id", conversationId!)
        .single();

      if (!conv) return null;
      const partnerId = conv.customer_id === user?.id ? conv.provider_id : conv.customer_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", partnerId)
        .single();

      const { data: cleanerProfile } = await supabase
        .from("cleaner_profiles")
        .select("business_name, profile_image")
        .eq("user_id", partnerId)
        .maybeSingle();

      return {
        id: partnerId,
        full_name: cleanerProfile?.business_name || profile?.full_name || "Unknown",
        avatar_url: cleanerProfile?.profile_image || profile?.avatar_url || null,
      };
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Clean up file preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Unsupported file type", description: "Please upload an image, PDF, or text file.", variant: "destructive" });
      return;
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(file);
    if (IMAGE_TYPES.includes(file.type)) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }

    // Reset file input so same file can be re-selected
    e.target.value = "";
  }, [filePreviewUrl]);

  const clearFile = useCallback(() => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
  }, [filePreviewUrl]);

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  // Handle typing indicator on input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      if (e.target.value.trim()) {
        setTyping(true);
      } else {
        setTyping(false);
      }
    },
    [setTyping]
  );

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || sending || isAdmin) return;
    setSending(true);
    try {
      let attachmentUrl: string | undefined;

      if (selectedFile) {
        setUploading(true);
        attachmentUrl = await uploadFile(selectedFile);
        setUploading(false);
      }

      const text = inputText.trim() || (selectedFile ? `📎 ${selectedFile.name}` : "");
      await sendMessage(text, attachmentUrl);
      setInputText("");
      clearFile();
      setTyping(false);
      inputRef.current?.focus();
    } catch (err: any) {
      setUploading(false);
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Select a Conversation</p>
          <p className="text-sm text-muted-foreground mt-1">Choose from your inbox to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={partner?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {(partner?.full_name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <OnlineStatusDot
            online={partnerOnline}
            className="absolute -bottom-0.5 -right-0.5"
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {partner?.full_name || "Loading..."}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isAdmin
              ? "Admin view (read-only)"
              : partnerTyping
              ? "Typing..."
              : partnerOnline
              ? "Online"
              : "Offline"}
          </p>
        </div>
        {/* Info icon - Order History */}
        {partner && conversationId && (
          <ChatInfoSheet conversationId={conversationId} partnerId={partner.id} partnerName={partner.full_name} />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "")}>
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === user?.id;
              const showDate = i === 0 || !isSameDay(msg.created_at, messages[i - 1].created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {formatDateLabel(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn("flex mb-1", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        isBookingDetailsMessage(msg.text)
                          ? "p-0 bg-transparent"
                          : isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {/* Attachment */}
                      {msg.attachment_url && (
                        <MessageAttachment url={msg.attachment_url} isOwn={isOwn} />
                      )}
                      {/* Booking details card */}
                      {isBookingDetailsMessage(msg.text) ? (
                        <BookingDetailsCard text={msg.text} />
                      ) : (
                        <>
                          {/* Text — hide if it's just the auto-generated file name */}
                          {msg.text && !msg.text.startsWith("📎 ") && (
                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                          )}
                          {msg.text && msg.text.startsWith("📎 ") && !msg.attachment_url && (
                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </>
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px]",
                            isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                        {isOwn && (
                          msg.read_at ? (
                            <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                          ) : (
                            <Check className="h-3 w-3 text-primary-foreground/40" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}
        {partnerTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* File preview bar */}
      {selectedFile && !isAdmin && (
        <div className="px-3 pt-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border">
            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="Preview" className="h-12 w-12 rounded object-cover" />
            ) : (
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isAdmin && (
        <div className="p-3 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_TYPES.join(",")}
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 h-10"
              maxLength={2000}
              disabled={sending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedFile) || sending}
              className="shrink-0 h-10 w-10"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

/** Renders an image or file attachment inside a message bubble */
const MessageAttachment = ({ url, isOwn }: { url: string; isOwn: boolean }) => {
  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(url);
  const fileName = decodeURIComponent(url.split("/").pop() || "file");
  // Remove the timestamp prefix from display name
  const displayName = fileName.replace(/^\d+-[a-z0-9]+\./, "file.");

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1">
        <img
          src={url}
          alt="Attachment"
          className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg mb-1 transition-colors",
        isOwn
          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
          : "bg-background hover:bg-muted"
      )}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="text-xs truncate underline">{displayName}</span>
    </a>
  );
};

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

/** Detects if a message is a booking details card */
function isBookingDetailsMessage(text: string): boolean {
  return text.startsWith("📋 **Booking Details**") || text.startsWith("📋 **Quote Request**");
}

/** Parses and renders booking/quote details as a styled card */
const BookingDetailsCard = ({ text }: { text: string }) => {
  const isQuoteRequest = text.startsWith("📋 **Quote Request**");
  const lines = text.split("\n").filter(Boolean);

  const extract = (prefix: string) => {
    const line = lines.find((l) => l.includes(prefix));
    return line ? line.split(prefix)[1]?.trim() : null;
  };

  const service = extract("🧹 Service") || extract("🧹 Services: ");
  const quoteType = extract("🏷️ Type: ");
  const date = extract("📅 Date: ") || extract("📅 Preferred Date: ");
  const rawTime = extract("🕐 Time: ");
  const time = rawTime?.split("•")[0]?.trim() ?? rawTime;
  const duration = extract("⏱️ Duration: ") ?? (rawTime?.includes("•") ? rawTime.split("•")[1]?.trim() : null);
  const total = extract("💰 Total: ");
  const address = extract("📍 ");
  const notes = extract("📝 Notes: ");

  const headerTitle = isQuoteRequest ? "Quote Request" : "Booking Details";
  const headerBg = isQuoteRequest ? "bg-secondary" : "bg-primary";
  const headerText = isQuoteRequest ? "text-secondary-foreground" : "text-primary-foreground";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden w-64 sm:w-72">
      <div className={cn(headerBg, "px-4 py-2.5")}>
        <div className="flex items-center gap-2">
          <ClipboardList className={cn("h-4 w-4", headerText)} />
          <span className={cn("text-sm font-semibold", headerText)}>{headerTitle}</span>
        </div>
      </div>
      <div className="p-3 space-y-2.5 text-sm">
        {quoteType && (
          <div className="flex items-start gap-2.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Type</p>
              <p className="font-semibold text-foreground">{quoteType}</p>
            </div>
          </div>
        )}
        {service && (
          <div className="flex items-start gap-2.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {isQuoteRequest ? "Services" : "Service"}
              </p>
              <p className="font-semibold text-foreground">{service}</p>
            </div>
          </div>
        )}
        {date && (
          <div className="flex items-start gap-2.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {isQuoteRequest ? "Preferred Date" : "Date"}
              </p>
              <p className="font-medium text-foreground">{date}</p>
            </div>
          </div>
        )}
        {time && (
          <div className="flex items-start gap-2.5">
            <Clock4 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Time</p>
              <p className="font-medium text-foreground">{time}</p>
            </div>
          </div>
        )}
        {duration && (
          <div className="flex items-start gap-2.5">
            <Clock4 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Duration</p>
              <p className="font-medium text-foreground">{duration}</p>
            </div>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Location</p>
              <p className="font-medium text-foreground">{address}</p>
            </div>
          </div>
        )}
        {notes && (
          <div className="flex items-start gap-2.5">
            <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Notes</p>
              <p className="text-muted-foreground">{notes}</p>
            </div>
          </div>
        )}
        {total && (
          <div className="mt-1 pt-2 border-t border-border flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-lg font-bold text-primary">{total}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/** Info sheet showing order history between the two users */
const STATUS_FILTERS = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"] as const;

const ChatInfoSheet = ({ conversationId, partnerId, partnerName }: { conversationId: string; partnerId: string; partnerName: string }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["chat-order-history", conversationId, partnerId],
    enabled: !!user && !!partnerId,
    queryFn: async () => {
      const { data: asCustomer } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", user!.id)
        .eq("cleaner_id", partnerId)
        .order("scheduled_date", { ascending: false });

      const { data: asCleaner } = await supabase
        .from("bookings")
        .select("*")
        .eq("cleaner_id", user!.id)
        .eq("customer_id", partnerId)
        .order("scheduled_date", { ascending: false });

      const all = [...(asCustomer || []), ...(asCleaner || [])];
      const unique = Array.from(new Map(all.map(b => [b.id, b])).values());
      unique.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
      return unique;
    },
  });

  const filtered = statusFilter === "all" ? bookings : bookings.filter(b => b.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "confirmed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "in_progress": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
          <Info className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-heading">Order History</SheetTitle>
          <p className="text-sm text-muted-foreground">Bookings with {partnerName}</p>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-1.5 mb-4">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors border",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {s === "in_progress" ? "In Progress" : s}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No bookings found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === "all" ? `No previous orders with ${partnerName}` : `No ${statusFilter.replace("_", " ")} bookings with ${partnerName}`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <Link
                key={booking.id}
                to={`/dashboard/booking/${booking.id}`}
                className="block rounded-lg border border-border p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{booking.service_type}</span>
                  <Badge className={cn("text-[10px] capitalize", getStatusColor(booking.status))}>
                    {booking.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock4 className="h-3 w-3" />
                    {booking.scheduled_time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{booking.duration_hours}h duration</span>
                  <span className="font-semibold text-foreground flex items-center gap-0.5">
                    <DollarSign className="h-3 w-3" />
                    {Number(booking.service_price).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ChatRoom;
