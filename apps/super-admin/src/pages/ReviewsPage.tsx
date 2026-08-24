import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasPermission, api } from "../lib/api";
import { useAuth } from "../context/auth";

export function ReviewsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canModerate = hasPermission(user, "reviews.moderate");

  const reports = useQuery({
    queryKey: ["admin", "review-reports"],
    queryFn: () => api.reviewReports(),
    enabled: canModerate,
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => api.dismissReviewReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "review-reports"] }),
  });

  const removeReview = useMutation({
    mutationFn: (reviewId: string) => api.adminRemoveReview(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "review-reports"] }),
  });

  if (!canModerate) {
    return <p className="muted">You do not have permission to moderate reviews.</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Review moderation</h2>
        <p className="muted">Reported reviews awaiting action</p>
      </div>

      {reports.isLoading ? <p className="muted">Loading reports…</p> : null}
      {reports.isError ? <p className="muted">Could not load reports.</p> : null}

      {!reports.isLoading && !reports.data?.items.length ? (
        <p className="muted">No open reports — queue is clear.</p>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Review</th>
              <th>Reason</th>
              <th>Reported</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(reports.data?.items ?? []).map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.review.business.name}</strong>
                  <div className="muted">{row.review.user.name}</div>
                </td>
                <td style={{ maxWidth: "20rem" }}>
                  <div>{row.review.rating}★</div>
                  <div className="muted">{row.review.comment}</div>
                </td>
                <td>{row.reason || "—"}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>
                  <div className="stack" style={{ flexDirection: "row", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn"
                      disabled={dismiss.isPending}
                      onClick={() => dismiss.mutate(row.id)}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      disabled={removeReview.isPending}
                      onClick={() => {
                        if (window.confirm("Remove this review permanently?")) {
                          removeReview.mutate(row.review.id);
                        }
                      }}
                    >
                      Remove review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
