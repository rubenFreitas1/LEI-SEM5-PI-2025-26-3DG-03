namespace Domain.Factory;

using Domain.Model;

public class RepresentativeFactory : IRepresentativeFactory
{
    public Representative NewRepresentative(ShippingAgentOrganization organization, string name, string citizenId, string nationality, string email, string phoneNumber)
    {
        return new Representative(organization, name, citizenId, nationality, email, phoneNumber);
    }
}