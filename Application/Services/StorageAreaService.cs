namespace Application.Services;

using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;
using Microsoft.Identity.Client.Extensions.Msal;

public class StorageAreaService
{
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IDockRepository _dockRepository;

    private readonly IStorageAreaFactory _storageAreaFactory;

    public StorageAreaService(IStorageAreaRepository storageAreaRepository, IDockRepository dockRepository, IStorageAreaFactory storageAreaFactory)
    {
        _storageAreaRepository = storageAreaRepository;
        _dockRepository = dockRepository;
        _storageAreaFactory = storageAreaFactory;
    }

    public async Task<IEnumerable<StorageAreaDTO>> GetAllStorageAreas()
    {
        IEnumerable<StorageArea> storageAreas = await _storageAreaRepository.GetStorageAreasAsync();
        IEnumerable<StorageAreaDTO> storageAreaDTOs = StorageAreaDTO.ToDTO(storageAreas);
        return storageAreaDTOs;
    }

    public async Task<StorageAreaDTO?> GetStorageAreaById(long id)
    {
        StorageArea? storageArea = await _storageAreaRepository.GetStorageAreaByIdAsync(id);
        if (storageArea != null)
        {
            StorageAreaDTO storageAreaDTO = StorageAreaDTO.ToDTO(storageArea);
            return storageAreaDTO;
        }
        return null;
    }

    public async Task<StorageAreaDTO?> GetStorageAreaByCode(string code)
    {
        StorageArea? storageArea = await _storageAreaRepository.GetStorageAreaByCodeAsync(code);
        if (storageArea != null)
        {
            StorageAreaDTO storageAreaDTO = StorageAreaDTO.ToDTO(storageArea);
            return storageAreaDTO;
        }
        return null;
    }

    public async Task<StorageAreaDTO?> GetStorageAreaByLocation(string location)
    {
        StorageArea? storageArea = await _storageAreaRepository.GetStorageAreaByLocationAsync(location);
        if (storageArea != null)
        {
            StorageAreaDTO storageAreaDTO = StorageAreaDTO.ToDTO(storageArea);
            return storageAreaDTO;
        }
        return null;
    }

    public async Task<StorageAreaDTO?> AddStorageArea(StorageAreaDTO storageAreaDTO, List<string> errorMessages)
    {
        StorageArea? storageArea = await _storageAreaRepository.GetStorageAreaByCodeAsync(storageAreaDTO.Code);
        if (storageArea != null)
        {
            errorMessages.Add("Storage area with this code already exists.");
            return null;
        }
        
        StorageArea? existingStorageAreaByLocation = await _storageAreaRepository.GetStorageAreaByLocationAsync(storageAreaDTO.Location);
        if (existingStorageAreaByLocation != null)
        {
            errorMessages.Add("Storage area with this location already exists.");
            return null;
        }

        if (!Enum.IsDefined(typeof(StorageAreaType), storageAreaDTO.StorageAreaType))
        {
            errorMessages.Add($"Invalid storage area type: {storageAreaDTO.StorageAreaType}.");
            return null;
        }
        try
        {
            storageArea = _storageAreaFactory.NewStorageArea(
                storageAreaDTO.Code,
                storageAreaDTO.Location,
                storageAreaDTO.StorageAreaType,
                storageAreaDTO.MaxCapacity,
                storageAreaDTO.CurrentCapacity
            );
            foreach (var storageAreaDockDTO in storageAreaDTO.StorageAreaDocks!)
            {
                Dock? dock = await _dockRepository.GetDockByNameAsync(storageAreaDockDTO.DockName);
                if (dock == null)
                {
                    errorMessages.Add($"Dock with name {storageAreaDockDTO.DockName} does not exist.");
                    return null;
                }
                storageArea.AddStorageAreaDock(dock, storageAreaDockDTO.Distance);
            }
        }
        catch (ArgumentException ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }
        StorageArea storageAreaSaved = await _storageAreaRepository.AddStorageArea(storageArea);
        StorageAreaDTO saDTO = StorageAreaDTO.ToDTO(storageAreaSaved);
        return saDTO;
    }

     
    public async Task<bool> UpdateStorageArea(long id,StorageAreaDTO storageAreaDTO, List<string> errorMessages)
    {
        StorageArea? storageArea = await _storageAreaRepository.GetStorageAreaByIdAsync(id);
        if (storageArea == null)
        {
            errorMessages.Add($"Storage area with id {id} does not exist.");
            return false;
        }
        StorageArea? storageAreaByCode = await _storageAreaRepository.GetStorageAreaByCodeAsync(storageAreaDTO.Code);
        if (storageAreaByCode != null && storageAreaByCode.Id != id)
        {
            errorMessages.Add($"Its not possible to update the storage area code.");
            return false;
        }
        StorageArea? storageAreaByLocation = await _storageAreaRepository.GetStorageAreaByLocationAsync(storageAreaDTO.Location);
        if (storageAreaByLocation != null && storageAreaByLocation.Id != id)
        {
            errorMessages.Add($"Storage area with location {storageAreaDTO.Location} already exists.");
            return false;
        }
        if(storageAreaDTO.StorageAreaType != storageArea.Type){
            errorMessages.Add("Its not possible to update the storage area type.");
            return false;
        }
        try{
            storageArea.ChangeLocation(storageAreaDTO.Location);
            storageArea.ChangeMaxCapacity(storageAreaDTO.MaxCapacity);
            storageArea.ChangeCurrentCapacity(storageAreaDTO.CurrentCapacity);
            storageArea.StorageAreaDocks!.Clear();
            foreach (var storageAreaDockDTO in storageAreaDTO.StorageAreaDocks!)
            {
                Dock? dock = await _dockRepository.GetDockByNameAsync(storageAreaDockDTO.DockName);
                if (dock == null)
                {
                    errorMessages.Add($"Dock with name {storageAreaDockDTO.DockName} does not exist.");
                    return false;
                }
                storageArea.AddStorageAreaDock(dock, storageAreaDockDTO.Distance);
            }
            await _storageAreaRepository.Update(storageArea, errorMessages);
            return true;
        }catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return false;
        }
        
    } 


}