using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class DepartmentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class CreateDepartmentRequest
    {
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(50, ErrorMessage = "Department name cannot exceed 50 characters")]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateDepartmentRequest
    {
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(50, ErrorMessage = "Department name cannot exceed 50 characters")]
        public string Name { get; set; } = string.Empty;
    }
}
