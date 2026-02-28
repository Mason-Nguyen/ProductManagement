namespace ProductManagement.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public bool Status { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
    }

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
        public Guid? DepartmentId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string Phone { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
        public bool Status { get; set; }
        public Guid? DepartmentId { get; set; }
    }
}
