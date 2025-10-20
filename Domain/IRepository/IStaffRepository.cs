namespace Domain.IRepository;

using Domain.Model;

public interface IStaffRepository : IGenericRepository<Staff>
{
    Task<Staff?> GetStaffByIDAsync(long id);
    Task<Staff?> GetStaffByEmailAsync(String email);
    Task<Staff?> GetStaffByPhoneAsync(String phone);
    Task<IEnumerable<Staff>> GetStaffByNameAsync(String name);
    Task<Staff> AddStaff(Staff staff);
    Task<IEnumerable<Staff>> GetStaffByQualificationCodeAsync(String qualificationCode);
    Task<IEnumerable<Staff>> GetStaffByStatusAsync(ResourceStatus status);
    Task<IEnumerable<Staff>> GetAllStaffAsync();
    Task<Staff?> Update(Staff staff, List<string> errorMessages);
}