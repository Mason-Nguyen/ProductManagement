using System.ComponentModel.DataAnnotations;

namespace ProductManagement.DTOs
{
    public class ApproveRequestDto
    {
        [Required(ErrorMessage = "ReviewerComment is required.")]
        [MaxLength(3000)]
        public string ReviewerComment { get; set; } = string.Empty;
    }

    public class UpdateCommentDto
    {
        [Required(ErrorMessage = "ReviewerComment is required.")]
        [MaxLength(3000)]
        public string ReviewerComment { get; set; } = string.Empty;
    }

    public class RejectRequestDto
    {
        [Required(ErrorMessage = "ReviewerComment is required.")]
        [MaxLength(3000)]
        public string ReviewerComment { get; set; } = string.Empty;
    }
}
