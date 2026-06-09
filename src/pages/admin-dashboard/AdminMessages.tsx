import ChatLayout from "@/components/chat/ChatLayout";

const AdminMessages = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Conversations</h1>
        <p className="text-sm text-muted-foreground">View all user conversations (read-only)</p>
      </div>
      <ChatLayout isAdmin />
    </div>
  );
};

export default AdminMessages;
