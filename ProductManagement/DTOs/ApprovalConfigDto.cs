using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class ApprovalConfigDto
    {
        public Guid Id { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public decimal MinAmount { get; set; }
        public decimal MaxAmount { get; set; }
    }

    public class CreateApprovalConfigRequest
    {
        [Required(ErrorMessage = "RoleId is required")]
        public Guid RoleId { get; set; }

        [Required(ErrorMessage = "MinAmount is required")]
        public decimal MinAmount { get; set; }

        [Required(ErrorMessage = "MaxAmount is required")]
        public decimal MaxAmount { get; set; }
    }

    public class UpdateApprovalConfigRequest
    {
        [Required(ErrorMessage = "RoleId is required")]
        public Guid RoleId { get; set; }

        [Required(ErrorMessage = "MinAmount is required")]
        public decimal MinAmount { get; set; }

        [Required(ErrorMessage = "MaxAmount is required")]
        public decimal MaxAmount { get; set; }
    }
}
