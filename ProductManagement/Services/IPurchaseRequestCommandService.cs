using ProductManagement.DTOs;

namespace ProductManagement.Services
{
    public interface IPurchaseRequestCommandService
    {
        Task<PurchaseRequestDto> SubmitAsync(Guid id, Guid userId);
        Task<PurchaseRequestDto> ApproveAsync(Guid id, Guid userId, string userRole, string reviewerComment);
        Task<PurchaseRequestDto> RejectAsync(Guid id, Guid userId, string reviewerComment);
        Task<PurchaseRequestDto> UpdateCommentAsync(Guid id, Guid userId, string reviewerComment);
    }
}
