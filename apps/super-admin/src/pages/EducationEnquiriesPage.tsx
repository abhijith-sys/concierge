import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { useAuth } from "../context/auth";
import { api, hasPermission } from "../lib/api";

export function EducationEnquiriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const params = new URLSearchParams({ pageSize: "50" });
  const list = useQuery({
    queryKey: ["admin", "education-enquiries", params.toString()],
    queryFn: () => api.educationEnquiries(params),
    enabled: hasPermission(user, "businesses.read"),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateEducationEnquiry(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "education-enquiries"] });
    },
  });

  if (!hasPermission(user, "businesses.read")) {
    return <p className="error">Missing businesses.read permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Education enquiries</h2>
        <p className="muted">Course requests sent to coaching, tuition, and training institutes</p>
      </div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Institute</th>
              <th>Learning</th>
              <th>Courses</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(list.data?.items ?? []).map((enquiry) => (
              <tr key={enquiry.id}>
                <td>
                  <strong>{enquiry.guestName}</strong>
                  <div className="muted">{enquiry.guestEmail}</div>
                  {enquiry.guestPhone ? <div className="muted">{enquiry.guestPhone}</div> : null}
                </td>
                <td>
                  {enquiry.business ? (
                    <Link to={`/businesses?q=${encodeURIComponent(enquiry.business.name)}`}>
                      {enquiry.business.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {new Date(enquiry.startDate).toLocaleDateString()}
                  {enquiry.preferredTime ? ` · ${enquiry.preferredTime}` : ""}
                  <div className="muted">{enquiry.learningMode || "—"}</div>
                  <div className="muted">
                    {enquiry.learners} learner{enquiry.learners === 1 ? "" : "s"}
                  </div>
                </td>
                <td>
                  {enquiry.courseSelections.map((row) => `${row.name ?? "Course"} × ${row.quantity}`).join(", ")}
                </td>
                <td>
                  {hasPermission(user, "businesses.moderate") ? (
                    <select
                      className="select"
                      value={enquiry.status}
                      onChange={(event) => update.mutate({ id: enquiry.id, status: event.target.value })}
                    >
                      <option value="new">new</option>
                      <option value="viewed">viewed</option>
                      <option value="responded">responded</option>
                      <option value="closed">closed</option>
                    </select>
                  ) : (
                    enquiry.status
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.isLoading && (list.data?.items.length ?? 0) === 0 ? (
          <EmptyList compact title="No education enquiries yet" />
        ) : null}
      </div>
    </div>
  );
}
