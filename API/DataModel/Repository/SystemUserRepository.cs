namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Domain.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Collections.Generic;

public class SystemUserRepository : GenericRepository<SystemUser>, ISystemUserRepository
{
    private readonly SystemUserMapper _systemUserMapper;

    public SystemUserRepository(ShippingManagementContext context, SystemUserMapper mapper) : base(context!)
    {
        _systemUserMapper = mapper;
    }

    public async Task<IEnumerable<SystemUser>> GetAllSystemUsers()
    {
        try
        {
            IEnumerable<SystemUserDataModel> systemUserDataModels = await _context.Set<SystemUserDataModel>()
                .ToListAsync();
            IEnumerable<SystemUser> systemUsers = _systemUserMapper.ToDomain(systemUserDataModels);
            return systemUsers;
        }
        catch
        {
            throw;
        }
    }

    public async Task<IEnumerable<SystemUser>> GetSystemUsersByRoleAsync(SystemRole role)
    {
        try
        {
            IEnumerable<SystemUserDataModel> systemUserDataModels = await _context.Set<SystemUserDataModel>()
                .Where(su => su.Role == role.ToString())
                .ToListAsync();
            IEnumerable<SystemUser> systemUsers = _systemUserMapper.ToDomain(systemUserDataModels);
            return systemUsers;
        }
        catch
        {
            throw;
        }
    }

    public async Task<SystemUser?> GetSystemUserById(long id)
    {
        try
        {
            SystemUserDataModel? systemUserDataModel = await _context.Set<SystemUserDataModel>()
                .FirstOrDefaultAsync(su => su.Id == id);

            if (systemUserDataModel == null)
            {
                return null;
            }
            SystemUser systemUser = _systemUserMapper.ToDomain(systemUserDataModel);
            return systemUser;
        }
        catch
        {
            throw;
        }
    }

    public async Task<SystemUser?> GetSystemUserByCode(string code)
    {
        try
        {
            SystemUserDataModel? systemUserDataModel = await _context.Set<SystemUserDataModel>()
                .FirstOrDefaultAsync(su => su.Code == code);

            if (systemUserDataModel == null)
            {
                return null;
            }

            SystemUser systemUser = _systemUserMapper.ToDomain(systemUserDataModel);
            return systemUser;
        }
        catch
        {
            throw;
        }
    }

    public async Task<SystemUser?> GetSystemUserByEmailAsync(string email)
    {
        try
        {
            SystemUserDataModel? systemUserDataModel = await _context.Set<SystemUserDataModel>()
                .FirstOrDefaultAsync(su => su.Email == email);

            if (systemUserDataModel == null)
            {
                return null;
            }
            SystemUser systemUser = _systemUserMapper.ToDomain(systemUserDataModel);
            return systemUser;
        }
        catch
        {
            throw;
        }
    }



    public async Task<SystemUser?> GetSystemUserByUsernameAsync(string username)
    {
        try
        {
            SystemUserDataModel? systemUserDataModel = await _context.Set<SystemUserDataModel>()
                .FirstOrDefaultAsync(su => su.Username == username);

            if (systemUserDataModel == null)
            {
                return null;
            }

            SystemUser systemUser = _systemUserMapper.ToDomain(systemUserDataModel);
            return systemUser;
        }
        catch
        {
            throw;
        }
    }

    public async Task<SystemUser> AddSystemUser(SystemUser systemUser)
    {
        try
        {
            SystemUserDataModel systemUserDataModel = _systemUserMapper.ToDataModel(systemUser);
            EntityEntry<SystemUserDataModel> addedEntry = _context.Set<SystemUserDataModel>().Add(systemUserDataModel);
            await _context.SaveChangesAsync();
            return _systemUserMapper.ToDomain(addedEntry.Entity);
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> Update(SystemUser systemUser, List<string> errorMessages)
    {
        try
        {
            SystemUserDataModel? systemUserDataModel = await _context.Set<SystemUserDataModel>()
                .FirstOrDefaultAsync(su => su.Id == systemUser.Id);

            if (systemUserDataModel == null)
            {
                errorMessages.Add($"SystemUser with Id {systemUser.Id} not found.");
                return false;
            }
            _systemUserMapper.UpdateDataModelAsync(systemUserDataModel, systemUser);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred while updating the StorageArea: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> SystemUserExistsByUsername(string username)
    {
        try
        {
            return await _context.Set<SystemUserDataModel>()
                .AnyAsync(su => su.Username == username);
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> SystemUserExistsByEmail(string email)
    {
        try
        {
            return await _context.Set<SystemUserDataModel>()
                .AnyAsync(su => su.Email == email);
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> SystemUserExistsByCode(string code)
    {
        try
        {
            return await _context.Set<SystemUserDataModel>()
                .AnyAsync(su => su.Code == code);
        }
        catch
        {
            throw;
        }
    }

    public async Task ResetAllUsersPrivacyPolicyAcceptanceAsync()
    {
        try
        {
            var allUsers = await _context.Set<SystemUserDataModel>().ToListAsync();
            foreach (var user in allUsers)
            {
                user.AcceptedCurrentPrivacyPolicy = false;
            }
            await _context.SaveChangesAsync();
        }
        catch
        {
            throw;
        }
    }

}