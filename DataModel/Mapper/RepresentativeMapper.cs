namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;
using Microsoft.EntityFrameworkCore;


public class RepresentativeMapper
{
    private IRepresentativeFactory _representativeFactory;

    private ShippingAgentOrganizationMapper _organizationMapper;
    public RepresentativeMapper(IRepresentativeFactory representativeFactory, ShippingAgentOrganizationMapper organizationMapper)
    {
        _representativeFactory = representativeFactory;
        _organizationMapper = organizationMapper;
    }

    public Representative ToDomain(RepresentativeDataModel representativeDM)
    {
        ShippingAgentOrganization? shippingAgentOrganization = null;
        if (representativeDM.Organization != null)
        {
            shippingAgentOrganization = _organizationMapper.ToDomain(representativeDM.Organization);
        }
        Representative representativeDomain = _representativeFactory.NewRepresentative(
            shippingAgentOrganization!,
            representativeDM.Name!,
            representativeDM.CitizenId!,
            representativeDM.Nationality!,
            representativeDM.Email!,
            representativeDM.PhoneNumber!);
        representativeDomain.Id = representativeDM.Id;
        representativeDomain.LastModifiedAt = representativeDM.LastModifiedAt;
        return representativeDomain;
    }

    public IEnumerable<Representative> ToDomain(IEnumerable<RepresentativeDataModel> representativeDataModels)
    {
        List<Representative> representativesDomain = new List<Representative>();

        foreach (RepresentativeDataModel representativeDataModel in representativeDataModels)
        {
            Representative representativeDomain = ToDomain(representativeDataModel);
            representativesDomain.Add(representativeDomain);
        }
        return representativesDomain.AsEnumerable();
    }

    public RepresentativeDataModel ToDataModel(Representative representative)
    {
        RepresentativeDataModel representativeDataModel = new RepresentativeDataModel(representative);
        representativeDataModel.LastModifiedAt = representative.LastModifiedAt;
        return representativeDataModel;
    }

    public async Task UpdateDataModelAsync(RepresentativeDataModel representativeDM, Representative representative, DbContext context)
    {
        var existingOrganization = await context.Set<ShippingAgentOrganizationDataModel>().FindAsync(representative.Organization!.Id);
        if (existingOrganization != null)
        {
            representativeDM.Organization = existingOrganization;
        }
        representativeDM.Name = representative.Name;
        representativeDM.CitizenId = representative.CitizenId;
        representativeDM.Nationality = representative.Nationality;
        representativeDM.Email = representative.Email;
        representativeDM.PhoneNumber = representative.PhoneNumber;
        representativeDM.LastModifiedAt = representative.LastModifiedAt;

    }
}