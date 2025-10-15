namespace Domain.Factory;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public class StaffFactory : IStaffFactory
{
    public Staff NewStaff(string name, IEnumerable<Qualification> qualification, string email, string phone)
    {
        return new Staff(name, qualification, email, phone);
    }
}