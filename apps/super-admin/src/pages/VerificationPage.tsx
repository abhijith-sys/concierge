import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyList } from "../components/EmptyList";
import { api, hasPermission } from "../lib/api";
import { useAuth } from "../context/auth";

export function VerificationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queue = useQuery({
    queryKey: ["admin", "verification"],
    queryFn: api.verificationQueue,
    enabled: hasPermission(user, "verification.review"),
  });

  const review = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected" }) =>
      api.reviewVerification(input.id, input.decision),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "verification"] });
    },
  });

  if (!hasPermission(user, "verification.review")) {
    return <p className="error">Missing verification.review permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>KYC queue</h2>
        <p className="muted">Review submitted identity / location verification</p>
      </div>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(queue.data ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.business?.name ?? item.businessId}</td>
                <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</td>
                <td>
                  <div className="row">
                    <button
                      className="btn primary"
                      type="button"
                      onClick={() => review.mutate({ id: item.id, decision: "approved" })}
                    >
                      Approve
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      onClick={() => review.mutate({ id: item.id, decision: "rejected" })}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!queue.isLoading && (queue.data?.length ?? 0) === 0 ? (
          <EmptyList compact title="No submissions in queue" />
        ) : null}
      </div>
    </div>
  );
}
