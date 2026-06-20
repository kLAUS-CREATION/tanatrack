import { Sparkles } from "lucide-react";

export default function AiChatPage() {
  return (
    <div className="w-full mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AI Chat
        </h1>
     </div>

      <div className="flex flex-1 min-h-[60vh] flex-col items-center justify-center rounded-sm p-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <span className="mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          Coming soon
        </span>
        <h3 className="text-lg font-semibold text-foreground">
          The AI assistant is on its way
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Soon you&apos;ll be able to chat with your data — check stock, surface
          slow movers, and get answers without digging through reports. Stay
          tuned.
        </p>
      </div>
    </div>
  );
}
