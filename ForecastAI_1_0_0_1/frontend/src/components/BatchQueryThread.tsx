import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "";

type BatchQueryThreadProps = {
  batchId: string;
  role: "PL" | "PH";
  raisedBy: "PL" | "PH";
  title: string;
  emptyMessage: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BatchQueryThread({
  batchId,
  role,
  raisedBy,
  title,
  emptyMessage,
}: BatchQueryThreadProps) {
  const queryClient = useQueryClient();
  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["comments", "batch", batchId, "PH_PL"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/comments/batch/${batchId}?queryType=PH_PL`);
      if (!response.ok) throw new Error("Failed to fetch batch queries");
      return response.json();
    },
  });
  const [newQuery, setNewQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const createMessage = useMutation({
    mutationFn: async ({ parentId, message, messageRaisedBy }: { parentId?: string; message: string; messageRaisedBy: string }) => {
      const response = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          message: message.trim(),
          sentBy: messageRaisedBy,
          queryType: "PH_PL",
          parentId,
          messageType: parentId ? "reply" : "query",
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "batch", batchId, "PH_PL"] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-pl"] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-ph"] });
      setNewQuery("");
      setReplyText("");
      setReplyingTo(null);
      toast.success("Message sent");
    },
    onError: () => toast.error("Failed to send message"),
  });

  const resolveThread = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved", resolvedBy: role }),
      });
      if (!response.ok) throw new Error("Failed to resolve thread");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "batch", batchId, "PH_PL"] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-pl"] });
      queryClient.invalidateQueries({ queryKey: ["batch-query-summary-ph"] });
      toast.success("Thread marked as resolved");
    },
    onError: () => toast.error("Failed to resolve thread"),
  });

  const visibleQueries = queries.filter((query: any) => query.sentBy === raisedBy);
  const openQueries = visibleQueries.filter((query: any) => query.status !== "Resolved");

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h4>
          <p className="text-xs text-slate-500">{openQueries.length} open thread{openQueries.length === 1 ? "" : "s"}</p>
        </div>
        {openQueries.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">Awaiting response</span>
        )}
      </div>

      {role === raisedBy && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <textarea
            value={newQuery}
            onChange={event => setNewQuery(event.target.value)}
            rows={3}
            placeholder={`Write a ${raisedBy} query...`}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400"
          />
          <div className="flex justify-end">
            <button
              onClick={() => createMessage.mutate({ message: newQuery, messageRaisedBy: raisedBy })}
              disabled={!newQuery.trim() || createMessage.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {createMessage.isPending ? "Sending..." : "Raise Query"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading query threads...</div>
      ) : visibleQueries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">
          {visibleQueries.map((query: any) => {
            const replies = [
              ...(query.replies || []),
              ...(query.response ? [{ id: `${query.id}-legacy-response`, message: query.response, sentBy: query.respondedBy || "PL", sentAt: query.respondedAt || query.sentAt }] : []),
            ];
            const resolved = query.status === "Resolved";
            return (
              <div key={query.id} className={`rounded-2xl border-l-4 p-4 shadow-sm ${resolved ? "border-emerald-400 bg-emerald-50" : "border-amber-400 bg-amber-50/70"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-800">PH</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">Practice Head</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${resolved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{resolved ? "Resolved" : "Open"}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(query.sentAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{query.message}</p>
                  </div>
                </div>

                {replies.map((reply: any) => (
                  <div key={reply.id} className={`mt-3 ml-11 rounded-xl border-l-4 p-3 ${reply.sentBy === "PH" ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${reply.sentBy === "PH" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{reply.sentBy}</div>
                      <span className="text-xs font-semibold text-slate-700">{reply.sentBy === "PH" ? "Practice Head" : "Practice Lead"}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(reply.sentAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{reply.message}</p>
                  </div>
                ))}

                {!resolved && (
                  <div className="mt-3 ml-11">
                    {replyingTo === query.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={event => setReplyText(event.target.value)}
                          rows={3}
                          placeholder={`Reply as ${role}...`}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                          <button
                            onClick={() => createMessage.mutate({ parentId: query.id, message: replyText, messageRaisedBy: role })}
                            disabled={!replyText.trim() || createMessage.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" /> Send Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => setReplyingTo(query.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600">
                          <MessageSquare className="h-3.5 w-3.5" /> Reply
                        </button>
                        {role === raisedBy && (
                          <button onClick={() => resolveThread.mutate(query.id)} disabled={resolveThread.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
