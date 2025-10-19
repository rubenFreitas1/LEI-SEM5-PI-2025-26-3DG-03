namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;

public class DockMapper
{

    private readonly IDockFactory _dockFactory;

    public DockMapper(IDockFactory dockFactory)
    {
        _dockFactory = dockFactory;
    }

    public Dock ToDomain(DockDataModel dockDM)
    {
        var vesselTypes = new List<VesselType>();
        if (dockDM.VesselTypesAllowed != null)
        {
            foreach (var vt in dockDM.VesselTypesAllowed)
            {
                if (vt != null)
                {
                    vesselTypes.Add(new VesselTypeMapper(new Domain.Factory.VesselTypeFactory()).ToDomain(vt));
                }
            }
        }
        Dock dockDomain = _dockFactory.NewDock(dockDM.Name!, dockDM.Location!, dockDM.Length, dockDM.Depth, dockDM.MaxDraft, vesselTypes);
        dockDomain.Id = dockDM.Id;
        dockDomain.LastModifiedAt = dockDM.LastModifiedAt;
        return dockDomain;
    }

    public IEnumerable<Dock> ToDomain(IEnumerable<DockDataModel> dockDataModels)
    {
        List<Dock> docksDomain = new List<Dock>();

        foreach (DockDataModel dockDataModel in dockDataModels)
        {
            Dock dock = ToDomain(dockDataModel);
            docksDomain.Add(dock);
        }
        return docksDomain.AsEnumerable();
    }

    public DockDataModel ToDataModel(Dock dock)
    {
        DockDataModel dockDM = new DockDataModel(dock);
        dockDM.LastModifiedAt = dock.LastModifiedAt;
        return dockDM;
    }

    public async Task UpdateDataModelAsync(DockDataModel dockDM, Dock dock, DbContext context)
    {
        dockDM.Name = dock.Name;
        dockDM.Location = dock.Location;
        dockDM.Length = dock.Length;
        dockDM.Depth = dock.Depth;
        dockDM.MaxDraft = dock.MaxDraft;
        dockDM.LastModifiedAt = dock.LastModifiedAt;

        dockDM.VesselTypesAllowed!.Clear();

        foreach (var vt in dock.VesselTypesAllowed!)
        {
            var existingVT = await context.Set<VesselTypeDataModel>().FindAsync(vt.Id);
            if (existingVT != null)
            {
                dockDM.VesselTypesAllowed.Add(existingVT);
            }
        }
    }




}