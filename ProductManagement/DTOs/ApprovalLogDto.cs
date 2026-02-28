namespace ProductManagement.DTOs
{
    public class ApprovalLogDto
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public string RequestTitle { get; set; } = string.Empty;
        public Guid ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public int Action { get; set; }
        public string ActionText { get; set; } = string.Empty;
        public string? ApproverComment { get; set; }
        public DateTime LogTime { get; set; }
    }
}
