namespace Domain.IRepository;

using Domain.Model;

public interface ISystemUserRepository : IGenericRepository<SystemUser>
{

    Task<IEnumerable<SystemUser>> GetAllSystemUsers();

    Task<IEnumerable<SystemUser>> GetSystemUsersByRoleAsync(SystemRole role);

    Task<SystemUser?> GetSystemUserByCode(string code);

    Task<SystemUser?> GetSystemUserById(long id);
    Task<SystemUser?> GetSystemUserByUsernameAsync(string username);

    Task<SystemUser?> GetSystemUserByEmailAsync(string email);

    Task<SystemUser> AddSystemUser(SystemUser systemUser);

    Task<bool> Update(SystemUser systemUser, List<string> errorMessages);

    Task<bool> SystemUserExistsByUsername(string username);

    Task<bool> SystemUserExistsByEmail(string email);

    Task<bool> SystemUserExistsByCode(string code);

    Task ResetAllUsersPrivacyPolicyAcceptanceAsync();
}