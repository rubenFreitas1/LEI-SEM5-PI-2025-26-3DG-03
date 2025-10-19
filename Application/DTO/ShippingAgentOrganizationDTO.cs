namespace Application.DTO;

using Domain.Model;

public class ShippingAgentOrganizationDTO
{
    public long Id { get; set; }

    public string? Code { get; set; }

    public string? LegalName { get; set; }

    public string? AlternativeName { get; set; }

    public string? Address { get; set; }

    public string? TaxNumber { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public ShippingAgentOrganizationDTO() { }

    public ShippingAgentOrganizationDTO(long id, string code, string legalName, string alternativeName, string address, string taxNumber)
    {
        Id = id;
        Code = code;
        LegalName = legalName;
        AlternativeName = alternativeName;
        Address = address;
        TaxNumber = taxNumber;
    }

    static public ShippingAgentOrganizationDTO ToDTO(ShippingAgentOrganization organization)
    {
        try
        {
            ShippingAgentOrganizationDTO organizationDTO = new ShippingAgentOrganizationDTO(organization.Id, organization.Code!, organization.LegalName!, organization.AlternativeName!, organization.Address!, organization.TaxNumber!);
            organizationDTO.LastModifiedAt = organization.LastModifiedAt;
            return organizationDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to ShippingAgentOrganizationDTO: {ex.Message}");
        }
    }

    static public IEnumerable<ShippingAgentOrganizationDTO> ToDTO(IEnumerable<ShippingAgentOrganization> organizations)
    {
        List<ShippingAgentOrganizationDTO> organizationDTOs = new List<ShippingAgentOrganizationDTO>();
        foreach (ShippingAgentOrganization organization in organizations)
        {
            ShippingAgentOrganizationDTO organizationDTO = ToDTO(organization);
            organizationDTOs.Add(organizationDTO);
        }
        return organizationDTOs;
    }

    static public ShippingAgentOrganization ToDomain(ShippingAgentOrganizationDTO organizationDTO)
    {
        if (organizationDTO.Code is null)
            throw new InvalidOperationException("ShippingAgentOrganization.Code cannot be null");
        if (organizationDTO.LegalName is null)
            throw new InvalidOperationException("ShippingAgentOrganization.LegalName cannot be null");
        if (organizationDTO.AlternativeName is null)
            throw new InvalidOperationException("ShippingAgentOrganization.AlternativeName cannot be null");
        if (organizationDTO.Address is null)
            throw new InvalidOperationException("ShippingAgentOrganization.Address cannot be null");
        if (organizationDTO.TaxNumber is null)
            throw new InvalidOperationException("ShippingAgentOrganization.TaxNumber cannot be null");

        ShippingAgentOrganization organization = new ShippingAgentOrganization(organizationDTO.Code, organizationDTO.LegalName, organizationDTO.AlternativeName, organizationDTO.Address, organizationDTO.TaxNumber);
        return organization;
    }

    static public ShippingAgentOrganization UpdateToDomain(ShippingAgentOrganization organization, ShippingAgentOrganizationDTO organizationDTO)
    {
        organization.ChangeLegalName(organizationDTO.LegalName!);
        organization.ChangeAlternativeName(organizationDTO.AlternativeName!);
        organization.ChangeAddress(organizationDTO.Address!);
        organization.ChangeTaxNumber(organizationDTO.TaxNumber!);
        return organization;
    }
    
}