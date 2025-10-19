namespace Application.DTO;

public class ShippingAgentOrganizationWithRepresentativeDTO
{
    public long Id { get; set; }
    public string? Code { get; set; }
    public string? LegalName { get; set; }
    public string? AlternativeName { get; set; }
    public string? Address { get; set; }
    public string? TaxNumber { get; set; }
    public DateTime LastModifiedAt { get; set; }


    public string? RepresentativeName { get; set; }
    public string? RepresentativeCitizenId { get; set; }
    public string? RepresentativeNationality { get; set; }
    public string? RepresentativeEmail { get; set; }
    public string? RepresentativePhoneNumber { get; set; }

    public ShippingAgentOrganizationWithRepresentativeDTO() { }

    public ShippingAgentOrganizationWithRepresentativeDTO(
        string code, string legalName, string alternativeName, string address, string taxNumber,
        string representativeName, string representativeCitizenId, string representativeNationality, 
        string representativeEmail, string representativePhoneNumber)
    {
        Code = code;
        LegalName = legalName;
        AlternativeName = alternativeName;
        Address = address;
        TaxNumber = taxNumber;
        RepresentativeName = representativeName;
        RepresentativeCitizenId = representativeCitizenId;
        RepresentativeNationality = representativeNationality;
        RepresentativeEmail = representativeEmail;
        RepresentativePhoneNumber = representativePhoneNumber;
    }

    public ShippingAgentOrganizationDTO GetOrganizationDTO()
    {
        return new ShippingAgentOrganizationDTO
        {
            Id = this.Id,
            Code = this.Code,
            LegalName = this.LegalName,
            AlternativeName = this.AlternativeName,
            Address = this.Address,
            TaxNumber = this.TaxNumber,
            LastModifiedAt = this.LastModifiedAt
        };
    }

    public RepresentativeDTO GetRepresentativeDTO()
    {
        return new RepresentativeDTO
        {
            OrganizationName = this.LegalName,
            Name = this.RepresentativeName,
            CitizenId = this.RepresentativeCitizenId,
            Nationality = this.RepresentativeNationality,
            Email = this.RepresentativeEmail,
            PhoneNumber = this.RepresentativePhoneNumber
        };
    }
}
