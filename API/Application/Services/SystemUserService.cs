namespace Application.Services;


using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;
using System.ComponentModel;
using NuGet.Protocol.Plugins;
using System.Xml.Schema;
using Microsoft.Extensions.Configuration;
using Application.Services;

public class SystemUserService
{
    private readonly ISystemUserRepository _systemUserRepository;
    private readonly ISystemUserFactory _systemUserFactory;
    private readonly IConfiguration _configuration;
    private readonly IRepresentativeRepository _representativeRepository;
    private readonly IEmailService _emailService;

    public SystemUserService(ISystemUserRepository systemUserRepository, ISystemUserFactory systemUserFactory, IRepresentativeRepository representativeRepository, IConfiguration configuration, IEmailService emailService)
    {
        _systemUserRepository = systemUserRepository;
        _systemUserFactory = systemUserFactory;
        _representativeRepository = representativeRepository;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<IEnumerable<SystemUserDTO>> GetAllSystemUsers()
    {
        IEnumerable<SystemUser> systemUsers = await _systemUserRepository.GetAllSystemUsers();
        IEnumerable<SystemUserDTO> systemUserDTOs = SystemUserDTO.ToDTO(systemUsers);
        return systemUserDTOs;
    }

    public async Task<IEnumerable<SystemUserDTO>> GetSystemUsersByRoleAsync(SystemRole role)
    {
        IEnumerable<SystemUser> systemUsers = await _systemUserRepository.GetSystemUsersByRoleAsync(role);
        IEnumerable<SystemUserDTO> systemUserDTOs = SystemUserDTO.ToDTO(systemUsers);
        return systemUserDTOs;
    }

    public async Task<SystemUserDTO?> GetSystemUserById(long id)
    {
        SystemUser? systemUser = await _systemUserRepository.GetSystemUserById(id);
        if (systemUser != null)
        {
            SystemUserDTO systemUserDTO = SystemUserDTO.ToDTO(systemUser);
            return systemUserDTO;
        }
        return null;
    }

    public async Task<SystemUserDTO?> GetSystemUserByCode(string code)
    {
        SystemUser? systemUser = await _systemUserRepository.GetSystemUserByCode(code);
        if (systemUser != null)
        {
            SystemUserDTO systemUserDTO = SystemUserDTO.ToDTO(systemUser);
            return systemUserDTO;
        }
        return null;
    }

    public async Task<SystemUserDTO?> GetSystemUserByUsername(string username)
    {
        SystemUser? systemUser = await _systemUserRepository.GetSystemUserByUsernameAsync(username);
        if (systemUser != null)
        {
            SystemUserDTO systemUserDTO = SystemUserDTO.ToDTO(systemUser);
            return systemUserDTO;
        }
        return null;
    }

    public async Task<SystemUserDTO?> GetSystemUserByEmail(string email)
    {
        SystemUser? systemUser = await _systemUserRepository.GetSystemUserByEmailAsync(email);
        if (systemUser != null)
        {
            SystemUserDTO systemUserDTO = SystemUserDTO.ToDTO(systemUser);
            return systemUserDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByEmail(string email)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByEmailAsync(email);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<SystemUserDTO?> AddSystemUser(SystemUserDTO dto, List<string> errorMessages)
    {
        if (await SystemUserExistsByCode(dto.Code!))
        {
            errorMessages.Add("Code already exists.");
            return null;
        }
        if (await SystemUserExistsByUsername(dto.Username!))
        {
            errorMessages.Add("Username already exists.");
            return null;
        }
        if (await SystemUserExistsByEmail(dto.Email!))
        {
            errorMessages.Add("Email already exists.");
            return null;
        }
        SystemUser user;
        try
        {
            user = _systemUserFactory.NewSystemUser(dto.Code, dto.Username, dto.Email, dto.Role);

        }
        catch (Exception ex)
        {
            errorMessages.Add($"Error creating system user: {ex.Message}");
            return null;
        }

        SystemUser userSaved = await _systemUserRepository.AddSystemUser(user);
        SystemUserDTO systemUserDTO = SystemUserDTO.ToDTO(userSaved);
        return systemUserDTO;
    }

    public async Task<bool> UpdateSystemUser(string code, SystemUserDTO systemUserDTO, List<string> errorMessages)
    {
        SystemUser? systemUser = await _systemUserRepository.GetSystemUserByCode(code);
        if (systemUser == null)
        {
            errorMessages.Add("There is no System User with this code.");
            return false;
        }
        if (code != systemUserDTO.Code)
        {
            errorMessages.Add("System User Code is not updatable");
            return false;
        }

        var username = await _systemUserRepository.GetSystemUserByUsernameAsync(systemUserDTO.Username);
        if (username != null && systemUser.Username != systemUserDTO.Username)
        {
            errorMessages.Add("There is already a System User with this username!");
            return false;
        }
        var email = await _systemUserRepository.GetSystemUserByEmailAsync(systemUserDTO.Email);
        if (email != null && systemUser.Email != systemUserDTO.Email)
        {
            errorMessages.Add("There is already a System User with this email!");
            return false;
        }
        try
        {
            systemUser.ChangeUsername(systemUserDTO.Username);
            systemUser.ChangeUserStatus(systemUserDTO.Status);
            systemUser.ChangeSystemRole(systemUserDTO.Role);
            return await _systemUserRepository.Update(systemUser, errorMessages);
        }
        catch (Exception ex)
        {
            errorMessages.Add($"Error updating system user: {ex.Message}");
            return false;
        }
    }
    public async Task<bool> SendActivationEmail(SystemUserDTO user)
    {
        string activationLink = GenerateActivationLink(user.Code);

        await _emailService.SendEmailAsync(user.Email!, "Ative sua conta",
            $"Clique aqui para ativar sua conta: <a href='{activationLink}'>Ativar</a>");

        return true;
    }

    private string GenerateActivationLink(string userCode)
    {
        var token = Guid.NewGuid().ToString();

        return $"{_configuration["AppSettings:ActivationBaseUrl"]}?token={token}&code={userCode}";
    }
    public async Task<bool> SystemUserExistsByCode(string code)
    {
        return await _systemUserRepository.SystemUserExistsByCode(code);
    }
    public async Task<bool> SystemUserExistsByUsername(string username)
    {
        return await _systemUserRepository.SystemUserExistsByUsername(username);
    }

    public async Task<bool> SystemUserExistsByEmail(string email)
    {
        return await _systemUserRepository.SystemUserExistsByEmail(email);
    }
}