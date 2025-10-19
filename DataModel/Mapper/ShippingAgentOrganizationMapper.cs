namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;
using Microsoft.EntityFrameworkCore;

public class ShippingAgentOrganizationMapper
{
    private IShippingAgentOrganizationFactory _shippingAgentFactory;

    public ShippingAgentOrganizationMapper(IShippingAgentOrganizationFactory shippingAgentFactory)
    {
        _shippingAgentFactory = shippingAgentFactory;
    }

    public ShippingAgentOrganization ToDomain(ShippingAgentOrganizationDataModel organizationDM)
    {
        ShippingAgentOrganization organizationDomain = _shippingAgentFactory.NewShippingAgentOrganization(
            organizationDM.Code!,
            organizationDM.LegalName!,
            organizationDM.AlternativeName!,
            organizationDM.Address!,
            organizationDM.TaxNumber!);
        organizationDomain.Id = organizationDM.Id;
        organizationDomain.LastModifiedAt = organizationDM.LastModifiedAt;
        return organizationDomain;
    }

    public IEnumerable<ShippingAgentOrganization> ToDomain(IEnumerable<ShippingAgentOrganizationDataModel> organizationDataModels)
    {
        List<ShippingAgentOrganization> organizationsDomain = new List<ShippingAgentOrganization>();

        foreach (ShippingAgentOrganizationDataModel organizationDataModel in organizationDataModels)
        {
            ShippingAgentOrganization organization = ToDomain(organizationDataModel);
            organizationsDomain.Add(organization);
        }
        return organizationsDomain.AsEnumerable();
    }

    public ShippingAgentOrganizationDataModel ToDataModel(ShippingAgentOrganization organization)
    {
        ShippingAgentOrganizationDataModel organizationDataModel = new ShippingAgentOrganizationDataModel(organization);
        organizationDataModel.LastModifiedAt = organization.LastModifiedAt;
        return organizationDataModel;
    }

    public void UpdateDataModelAsync(ShippingAgentOrganizationDataModel organizationDM, ShippingAgentOrganization organization, DbContext context)
    {
        organizationDM.Code = organization.Code;
        organizationDM.LegalName = organization.LegalName;
        organizationDM.AlternativeName = organization.AlternativeName;
        organizationDM.Address = organization.Address;
        organizationDM.TaxNumber = organization.TaxNumber;
        organizationDM.LastModifiedAt = organization.LastModifiedAt;
    }

}