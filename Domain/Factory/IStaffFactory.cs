namespace Domain.Factory;

using Domain.Model;
using ShippingManagement.Domain.Qualifications;

public interface IStaffFactory
{
    Staff NewStaff(String name, IEnumerable<Qualification> qualification, String email, String phone);
}