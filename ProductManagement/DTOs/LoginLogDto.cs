namespace ProductManagement.DTOs
{
    public class LoginLogDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public int Action { get; set; }
        public string ActionText { get; set; } = string.Empty;
        public DateTime ActionTime { get; set; }
        public string IpAddress { get; set; } = string.Empty;
    }
}
