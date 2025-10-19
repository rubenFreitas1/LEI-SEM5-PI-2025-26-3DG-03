namespace Domain.IRepository;

using Domain.Model;

public interface IShippingAgentOrganizationRepository : IGenericRepository<ShippingAgentOrganization>
{
    Task<IEnumerable<ShippingAgentOrganization>> GetShippingAgentOrganizationsAsync();

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByCodeAsync(string code);

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByIdAsync(long id);

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByLegalNameAsync(string legalName);

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByAlternativeNameAsync(string altarnativeName);

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByTaxNumberAsync(string taxNumber);

    Task<ShippingAgentOrganization?> GetShippingAgentOrganizationByAddressAsync(string address);

    Task<ShippingAgentOrganization> AddShippingAgentOrganization(ShippingAgentOrganization shippingAgentOrganization);

    Task<ShippingAgentOrganization?> Update(ShippingAgentOrganization shippingAgentOrganization, List<string> errorMessages);

    Task<bool> ShippingAgentOrganizationExists(long id);
}