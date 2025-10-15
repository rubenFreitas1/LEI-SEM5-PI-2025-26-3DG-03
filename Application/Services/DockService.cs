namespace Application.Services;

using Domain.Model;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;

public class DockService
{

    private readonly IDockRepository _dockRepository;
    private readonly IVesselTypeRepository _vesselTypeRepository;

    private readonly IDockFactory _dockFactory;

    public DockService(IDockRepository dockRepository, IVesselTypeRepository vesselTypeRepository, IDockFactory dockFactory)
    {
        _dockRepository = dockRepository;
        _vesselTypeRepository = vesselTypeRepository;
        _dockFactory = dockFactory;
    }

    public async Task<IEnumerable<DockDTO>> GetAllDocks()
    {
        IEnumerable<Dock> docks = await _dockRepository.GetDocksAsync();
        IEnumerable<DockDTO> dockDTOs = DockDTO.ToDTO(docks);
        return dockDTOs;
    }

    public async Task<DockDTO?> GetDockById(int id)
    {
        Dock? dock = await _dockRepository.GetDockByIdAsync(id);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<DockDTO?> GetDockByName(string name)
    {
        Dock? dock = await _dockRepository.GetDockByNameAsync(name);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<DockDTO?> GetDockByLocation(string location)
    {
        Dock? dock = await _dockRepository.GetDockByLocationAsync(location);
        if (dock != null)
        {
            DockDTO dockDTO = DockDTO.ToDTO(dock);
            return dockDTO;
        }
        return null;
    }

    public async Task<IEnumerable<DockDTO?>> GetDocksByVesselTypes(List<string> vesselTypesNames)
    {
        if (vesselTypesNames == null || !vesselTypesNames.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }
        List<VesselType> vesselTypes = new List<VesselType>();
        foreach (string name in vesselTypesNames)
        {
            VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(name);
            if (vesselType != null)
            {
                vesselTypes.Add(vesselType);
            }
        }
        if (vesselTypes == null || !vesselTypes.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }

        IEnumerable<Dock?> docks = await _dockRepository.GetDocksByVesselTypesAsync(vesselTypes);
        if (docks == null || !docks.Any())
        {
            return Enumerable.Empty<DockDTO?>();
        }
        IEnumerable<DockDTO> dockDTOs = DockDTO.ToDTO(docks.Where(d => d != null)!);
        return dockDTOs;
    }

    public async Task<DockDTO?> AddDock(DockDTO dockDTO, List<string> errorMessages)
    {
        Dock? dock = await _dockRepository.GetDockByNameAsync(dockDTO.Name!);
        if (dock != null)
        {
            errorMessages.Add($"A dock with the name '{dockDTO.Name}' already exists.");
            return null;
        }
        Dock? dockByLocation = await _dockRepository.GetDockByLocationAsync(dockDTO.Location!);
        if (dockByLocation != null)
        {
            errorMessages.Add($"A dock with the location '{dockDTO.Location}' already exists.");
            return null;
        }
        var vesselTypes = new List<VesselType>();
        foreach (var vesselTypeName in dockDTO.VesselTypesAllowed!)
        {
            var vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(vesselTypeName);
            if (vesselType != null)
            {
                vesselTypes.Add(vesselType);
            }
            else
            {
                errorMessages.Add($"Vessel type '{vesselTypeName}' does not exist.");
                return null;
            }
        }

        if (vesselTypes.Count != dockDTO.VesselTypesAllowed!.Count)
        {
            errorMessages.Add("One or more vessel types are invalid.");
            return null;
        }
        else if (vesselTypes.Count == 0)
        {
            errorMessages.Add("At least one valid vessel type must be provided.");
            return null;
        }
        try
        {
            dock = _dockFactory.NewDock(
                dockDTO.Name!,
                dockDTO.Location!,
                dockDTO.Length,
                dockDTO.Depth,
                dockDTO.MaxDraft,
                vesselTypes
            );
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }
        Dock dockSaved = await _dockRepository.AddDock(dock);
        DockDTO dDTO = DockDTO.ToDTO(dockSaved);
        return dDTO;
    }

    public async Task<bool> UpdateDock(long id, DockDTO dockDTO, List<string> errorMessages)
    {
        Dock? dockname = await _dockRepository.GetDockByNameAsync(dockDTO.Name!);
        if (dockname != null)
        {
            errorMessages.Add($"A dock with the name '{dockDTO.Name}' already exists.");
            return false;
        }
        Dock? dockByLocation = await _dockRepository.GetDockByLocationAsync(dockDTO.Location!);
        if (dockByLocation != null)
        {
            errorMessages.Add($"A dock with the location '{dockDTO.Location}' already exists.");
            return false;
        }
        Dock? dock = await _dockRepository.GetDockByIdAsync(id);
        if (dock == null)
        {
            errorMessages.Add("Dock not found");
            return false;
        }
        var vesselTypes = new List<VesselType>();
        foreach (var vesselTypeName in dockDTO.VesselTypesAllowed!)
        {
            var vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(vesselTypeName);
            if (vesselType != null)
            {
                vesselTypes.Add(vesselType);
            }
            else
            {
                errorMessages.Add($"Vessel type '{vesselTypeName}' does not exist.");
                return false;
            }
        }

        if (vesselTypes.Count != dockDTO.VesselTypesAllowed!.Count)
        {
            errorMessages.Add("One or more vessel types are invalid.");
            return false;
        }
        else if (vesselTypes.Count == 0)
        {
            errorMessages.Add("At least one valid vessel type must be provided.");
            return false;
        }
        try
        {
            if (dock != null)
            {
                dock.ChangeName(dockDTO.Name!);
                dock.ChangeLocation(dockDTO.Location!);
                dock.ChangeLength(dockDTO.Length);
                dock.ChangeDepth(dockDTO.Depth);
                dock.ChangeMaxDraft(dockDTO.MaxDraft);
                dock.ChangeVesselTypesAllowed(vesselTypes);
                await _dockRepository.Update(dock, errorMessages);
                return true;
            }
            else
            {
                errorMessages.Add("Dock not found");
                return false;
            }
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return false;
        }
    }




}