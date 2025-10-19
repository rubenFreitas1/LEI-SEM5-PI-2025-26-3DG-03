namespace Domain.IRepository;

using Domain.Model;

public interface IRepresentativeRepository : IGenericRepository<Representative>
{
    Task<IEnumerable<Representative>> GetRepresentativesAsync();

    Task<Representative?> GetRepresentativeByIdAsync(long id);

    Task<Representative?> GetRepresentativeByCitizenIdAsync(string citizenId);

    Task<Representative?> GetRepresentativeByEmailAsync(string email);

    Task<Representative?> GetRepresentativeByPhoneNumberAsync(string phoneNumber);

    Task<Representative?> GetRepresentativeByNameAsync(string name);

    Task<Representative?> GetRepresentativeByNationalityAsync(string nationality);

    Task<Representative?> GetRepresentativeByOrganizationAsync(ShippingAgentOrganization organization);

    Task<Representative> AddRepresentative(Representative representative);

    Task<Representative?> Update(Representative representative, List<string> errorMessages);

    Task<bool> RepresentativeExists(long id);
}