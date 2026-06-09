import { useLocation, useSearchParams } from "react-router-dom";
import ChatLayout from "@/components/chat/ChatLayout";

const CustomerMessages = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialConversationId = searchParams.get("conversation") || (location.state as any)?.conversationId || null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">Chat with your service providers</p>
      </div>
      <ChatLayout initialConversationId={initialConversationId} />
    </div>
  );
};

export default CustomerMessages;
