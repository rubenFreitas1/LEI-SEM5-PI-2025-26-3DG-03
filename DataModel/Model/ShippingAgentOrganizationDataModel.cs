using System.ComponentModel.DataAnnotations;
using Domain.Model;

namespace DataModel.Model;

public class ShippingAgentOrganizationDataModel
{

    public long Id { get; set; }

    [Required]
    public string? Code { get; set; }

    [Required]
    public string? LegalName { get; set; }

    [Required]
    public string? AlternativeName { get; set; }

    [Required]
    public string? Address { get; set; }

    [Required]
    public string? TaxNumber { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public ShippingAgentOrganizationDataModel() { }

    public ShippingAgentOrganizationDataModel(ShippingAgentOrganization organization)
    {
        Id = organization.Id;
        Code = organization.Code;
        LegalName = organization.LegalName;
        AlternativeName = organization.AlternativeName;
        Address = organization.Address;
        TaxNumber = organization.TaxNumber;
        LastModifiedAt = organization.LastModifiedAt;
    }

}