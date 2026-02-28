namespace ProductManagement.DTOs
{
    public class ProviderDto
    {
        public Guid Id { get; set; }
        public string ProviderName { get; set; } = string.Empty;
        public string TaxIdentification { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class CreateProviderRequest
    {
        public string ProviderName { get; set; } = string.Empty;
        public string TaxIdentification { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateProviderRequest
    {
        public string ProviderName { get; set; } = string.Empty;
        public string TaxIdentification { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
