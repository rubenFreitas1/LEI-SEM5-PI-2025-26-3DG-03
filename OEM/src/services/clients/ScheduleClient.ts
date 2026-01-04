import http, { IncomingMessage } from 'http';
import https from 'https';
import VesselVisitNotificationClient from './VesselVisitNotificationClient';

export interface PhysicalResourceDTO {
    code: string;
    name: string;
    kind: string;
    description?: string;
    status?: string;
    capacity?: number;
}

export interface ScheduleEntryDTO {
    vesselName: string;
    vessel?: string;
    vvnCode?: string;
    startTime?: Date;
    endTime?: Date;
    startTimeIso?: string;
    endTimeIso?: string;
    craneNames?: string[];
    assignedCranes?: string[];
    assignedCrane?: string[];
    staffNames?: string[];
    assignedStaff?: string[];
}

export interface ScheduleResponseDTO {
    entries?: ScheduleEntryDTO[];
    scheduleEntries?: ScheduleEntryDTO[];
    schedule?: {
        schedule?: ScheduleEntryDTO[];
        totalDelay?: number;
        executionTime?: number;
        messages?: string[];
        selectedAlgorithm?: string;
    };
    totalDelay?: number;
    TotalDelay?: number;
    executionTime?: number;
    ExecutionTime?: number;
    messages?: string[];
    Messages?: string[];
}

export default class ScheduleClient {
    private readonly baseUrl: string;
    private readonly apiBaseUrl: string;
    private vvnClient: VesselVisitNotificationClient;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiBaseUrl = process.env.API_URL || 'http://localhost:5000/api';
        this.vvnClient = new VesselVisitNotificationClient(this.apiBaseUrl);
    }

    /**
     * Get all physical resources (cranes) from the API
     */
    private async getPhysicalResources(authHeader?: string): Promise<PhysicalResourceDTO[]> {
        try {
            const url = `${this.apiBaseUrl}/PhysicalResources`;
            console.log(`Fetching physical resources from: ${url}`);
            const json = await this.getJson(url, authHeader);
            console.log(`Received physical resources:`, json);
            return Array.isArray(json) ? json : [];
        } catch (error) {
            console.error('Error fetching physical resources:', error);
            return [];
        }
    }

    /**
     * Get schedule by target day and algorithm
     */
    public async getScheduleByTargetDay(
        targetDay: Date,
        algorithm: string = 'automatic',
        timeLimit?: number,
        authHeader?: string
    ): Promise<ScheduleResponseDTO> {
        // Get all VVNs for the target day
        const allVvns = await this.vvnClient.getAll(authHeader);
        
        // Get all physical resources (cranes)
        const allResources = await this.getPhysicalResources(authHeader);
        console.log(`Total physical resources: ${allResources.length}`);
        
        const stsCranes = allResources.filter(r => r.kind === 'STS Crane' && r.status === 'Available');
        
        console.log(`Found ${stsCranes.length} available STS Cranes:`, stsCranes.map(c => ({ code: c.code, name: c.name, status: c.status })));
        
        // If no cranes found, use default
        if (stsCranes.length === 0) {
            console.warn('No STS Cranes found, using default configuration');
        }
        
        // Normalize target day to start of day
        const targetDayStart = new Date(targetDay);
        targetDayStart.setHours(0, 0, 0, 0);
        const targetDayEnd = new Date(targetDay);
        targetDayEnd.setHours(23, 59, 59, 999);
        
        // Filter VVNs that fall on the target day
        const vvnsForDay = allVvns.filter(vvn => {
            const eta = new Date(vvn.eta);
            return eta >= targetDayStart && eta <= targetDayEnd;
        });

        if (vvnsForDay.length === 0) {
            return { entries: [], schedule: { schedule: [], totalDelay: 0, executionTime: 0, messages: [] } };
        }

        // Build the request payload for Prolog with REAL cranes
        const maxCranes = stsCranes.length > 0 ? stsCranes.length : 2; // Default to 2 if none found
        const cranes = stsCranes.length > 0 ? stsCranes.map(c => ({ code: c.code, name: c.name, capacity: c.capacity || 5 })) : [];
        
        console.log(`Building Prolog payload with maxCranes=${maxCranes}, cranes=`, cranes);
        
        const payload = {
            vesselVisitNotifications: vvnsForDay,
            assignedCrane: {
                operationalCapacity: 5 // Default crane capacity
            },
            maxCranes: maxCranes,
            cranes: cranes,
            algorithm: algorithm,
            timeLimit: timeLimit || 0
        };

        console.log(`Payload for Prolog:`, JSON.stringify(payload, null, 2));

        const url = `${this.baseUrl}/api/scheduling/compute?algorithm=${encodeURIComponent(algorithm)}${timeLimit ? `&timeLimit=${timeLimit}` : ''}`;
        const json = await this.postJson(url, payload, authHeader);
        return json as ScheduleResponseDTO;
    }

    /**
     * Get schedule with genetic algorithm parameters
     */
    public async getScheduleWithGeneticAlgorithm(
        targetDay: Date,
        populationSize: number,
        generations: number,
        crossoverRate: number,
        mutationRate: number,
        desiredTime: number,
        stableGenerations: number,
        enableMultiCrane: boolean,
        authHeader?: string
    ): Promise<ScheduleResponseDTO> {
        const targetDayIso = targetDay.toISOString();
        const url = `${this.baseUrl}/Scheduling/GeneticAlgorithm?` +
            `targetDay=${encodeURIComponent(targetDayIso)}` +
            `&populationSize=${populationSize}` +
            `&generations=${generations}` +
            `&crossoverRate=${crossoverRate}` +
            `&mutationRate=${mutationRate}` +
            `&desiredTime=${desiredTime}` +
            `&stableGenerations=${stableGenerations}` +
            `&enableMultiCrane=${enableMultiCrane}`;

        const json = await this.getJson(url, authHeader);
        return json as ScheduleResponseDTO;
    }

    private async getJson(urlStr: string, authHeader?: string): Promise<any> {
        const urlObj = new URL(urlStr);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options: https.RequestOptions = {
            method: 'GET',
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + (urlObj.search || ''),
            headers: {
                'Accept': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            timeout: 300000 // 5 minutes timeout for scheduling
        };

        return new Promise((resolve, reject) => {
            const req = lib.request(options, (res: IncomingMessage) => {
                const { statusCode } = res;
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    if (statusCode && statusCode >= 200 && statusCode < 300) {
                        try {
                            resolve(data ? JSON.parse(data) : {});
                        } catch (err) {
                            reject(err);
                        }
                    } else if (statusCode === 404) {
                        resolve({ entries: [] });
                    } else if (statusCode === 401 || statusCode === 403) {
                        reject(new Error('Unauthorized when contacting Schedule API'));
                    } else {
                        reject(new Error(`Schedule API error: ${statusCode} ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Schedule API request timeout'));
            });
            req.end();
        });
    }

    private async postJson(urlStr: string, body: any, authHeader?: string): Promise<any> {
        const urlObj = new URL(urlStr);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;
        const bodyStr = JSON.stringify(body);

        const options: https.RequestOptions = {
            method: 'POST',
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + (urlObj.search || ''),
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'Accept': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            },
            timeout: 300000 // 5 minutes timeout for scheduling
        };

        return new Promise((resolve, reject) => {
            const req = lib.request(options, (res: IncomingMessage) => {
                const { statusCode } = res;
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    if (statusCode && statusCode >= 200 && statusCode < 300) {
                        try {
                            resolve(data ? JSON.parse(data) : {});
                        } catch (err) {
                            reject(err);
                        }
                    } else if (statusCode === 404) {
                        resolve({ entries: [] });
                    } else if (statusCode === 401 || statusCode === 403) {
                        reject(new Error('Unauthorized when contacting Schedule API'));
                    } else {
                        reject(new Error(`Schedule API error: ${statusCode} ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Schedule API request timeout'));
            });
            req.write(bodyStr);
            req.end();
        });
    }
}
