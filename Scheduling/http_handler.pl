:- module(http_handler, []).
:- use_module(library(http/http_client)).
:- use_module(library(http/json)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).
:- use_module('Modules/genetic_controller.pl').
:- use_module('Modules/rebalancing_controller.pl').
:- use_module('Modules/automatic_controller.pl').
:- dynamic vessel/6.
:- dynamic obtain_seq_shortest_delay_improved_multi/4.
:- dynamic available_cranes/1.


:- http_handler(root(api/scheduling/compute), handle_scheduling_request, []).
:- http_handler(root(api/scheduling/genetic), handle_genetic_request, []).

handle_scheduling_request(Request) :-
    catch(handle_scheduling_request_inner(Request), Error,
        (
            ( catch(term_to_atom(Error, ErrAtom), _, ErrAtom = 'unknown_error') ),
            with_output_to(user_error, format('ERRO ao processar JSON: ~w~n', [ErrAtom])),
            reply_json_dict(_{error: ErrAtom}, [status(400)])
        )
    ).

handle_scheduling_request_inner(Request) :-
    http_read_json_dict(Request, Dict),
    http_parameters(Request, [
        algorithm(AlgParam, [optional(true)]),
        timeLimit(TimeLimitParam, [optional(true), number])
    ]),
    (   (get_dict(algorithm, Dict, AlgJson) -> true ; AlgJson = '' ),
        (AlgParam \= '' -> Algorithm = AlgParam ; (AlgJson \= '' -> Algorithm = AlgJson ; Algorithm = default))
    ),
    with_output_to(user_error, format('Selected algorithm: ~w~n', [Algorithm])),
    ( get_dict(maxCranes, Dict, MaxCranes) -> true ; MaxCranes = 1 ),
    % Get cranes list from Dict (if provided)
    ( get_dict(cranes, Dict, CranesList) -> 
        (retractall(available_cranes(_)), assertz(available_cranes(CranesList)),
         length(CranesList, NumCranes),
         with_output_to(user_error, format('Received ~w real cranes from API~n', [NumCranes])))
    ; 
        (retractall(available_cranes(_)), assertz(available_cranes([])),
         with_output_to(user_error, format('No cranes list provided, will use generated names~n', [])))
    ),
    % TimeLimit can come from query parameter OR JSON body (query parameter takes precedence)
    ( var(TimeLimitParam) -> 
        ( get_dict(timeLimit, Dict, TimeLimit) -> true ; TimeLimit = 0 )
    ; 
        TimeLimit = TimeLimitParam 
    ),
    with_output_to(user_error, format('TimeLimit parameter: ~w hours~n', [TimeLimit])),
    ( process_data_with_algorithm(Algorithm, Dict, Result, MaxCranes, TimeLimit)
    -> (
            with_output_to(user_error, format('Result to reply: ~w~n', [Result])),
            reply_json_dict(_{status: "ok", schedule: Result})
       )
    ; reply_json_dict(_{error: "processing_failed"}, [status(500)])
    ).


% process_data_with_algorithm(+Algorithm, +Dict, -Result, +MaxCranes, +TimeLimit)
% Dispatches to the selected algorithm implementation.
process_data_with_algorithm(Algorithm, Dict, Result, MaxCranes, TimeLimit) :-
    retractall(vessel(_,_,_,_,_,_)),
    retractall(automatic_controller:vessel(_,_,_,_,_,_)),
    Notifications = Dict.vesselVisitNotifications,
    Crane = Dict.assignedCrane,
    CraneCapacity = Crane.operationalCapacity,
    
    % Check if rebalancing mode is requested
    downcase_atom(Algorithm, AlgorithmAtom),
    (   (AlgorithmAtom = 'rebalancing' ; AlgorithmAtom = 'rebalance')
    ->  % Use rebalancing-based approach: distribute vessels across docks, then apply auto selection per dock
        with_output_to(user_error, format('Using REBALANCING-BASED algorithm selection...~n', [])),
        
        % Get docks information from request
        Docks = Dict.get(docks, []),
        
        % Setup rebalancing facts
        retractall(rebalancing_algorithm:vessels(_,_,_,_)),
        retractall(rebalancing_algorithm:vessel(_,_,_,_)),
        retractall(rebalancing_algorithm:dock(_,_)),
        
        % Process docks and vessels for rebalancing
        maplist(setup_dock_fact, Docks),
        process_vessels_for_rebalancing(Notifications, CraneCapacity),
        
        % Run rebalancing-based scheduling with automatic algorithm selection per dock
        select_and_run_with_rebalancing(Docks, MaxCranes, TimeLimit, SeqTriplets, ShortestDelay, AlgoInfo),
        ExecutionTime = AlgoInfo.get(rebalancingTime, 0),
        SelectedAlgo = 'rebalancing_based',
        format(atom(SelectionReason), 'Rebalancing-based scheduling with per-dock algorithm selection (~w docks)', [AlgoInfo.numberOfDocks])
    ;
        % Standard vessel processing (non-rebalancing mode)
        process_vessels(Notifications, CraneCapacity, MaxCranes, _),
        
        % Check if automatic algorithm selection is requested
        (   (AlgorithmAtom = 'automatic' ; AlgorithmAtom = 'auto')
        ->  % Use automatic controller to select and run the best algorithm
            with_output_to(user_error, format('Using AUTOMATIC algorithm selection...~n', [])),
            select_and_run_algorithm(MaxCranes, TimeLimit, SeqTriplets, ShortestDelay, AlgoInfo),
            ExecutionTime = AlgoInfo.executionTime,
            SelectedAlgo = AlgoInfo.selectedAlgorithm,
            SelectionReason = AlgoInfo.selectionReason
        ;   % Manual algorithm selection (legacy mode)
            with_output_to(user_error, format('Using MANUAL algorithm selection: ~w~n', [AlgorithmAtom])),
            % First run a single-crane measurement to collect baseline stats for the popup
            automatic_controller:obtain_seq_shortest_delay(_SeqSingle, DelaySingle, ExecTimeSingle),
            % Now run the requested algorithm to obtain the final sequence (may be multi-crane)
            (   AlgorithmAtom = 'improved'
            ->  automatic_controller:obtain_seq_shortest_delay_improved_multi(SeqTriplets, ShortestDelay, ExecutionTime, MaxCranes),
                SelectedAlgo = heuristic,
                SelectionReason = 'Manually selected improved/heuristic algorithm'
            ;   % default or any other value: use optimal algorithm
                automatic_controller:obtain_seq_shortest_delay_multi(SeqTriplets, ShortestDelay, ExecutionTime, MaxCranes),
                SelectedAlgo = optimal,
                SelectionReason = 'Manually selected default/optimal algorithm'
            )
        )
    ),
    
    % Build human-friendly messages for the frontend popup
    % Format algorithm selection message
    atom_string(SelectedAlgo, SelectedAlgoStr),
    atom_string(SelectionReason, SelectionReasonStr),
    format(atom(AlgoSelectionMsg), 'Algorithm: ~w', [SelectedAlgoStr]),
    
    % Build messages based on whether it's automatic or manual mode
    (   (AlgorithmAtom = 'automatic' ; AlgorithmAtom = 'auto')
    ->  % Automatic mode: include crane mode information
        % Extract crane mode from AlgoInfo if available
        ( get_dict(craneMode, AlgoInfo, CraneModeAtom) ->
            atom_string(CraneModeAtom, CraneModeStr),
            ( CraneModeAtom = single_crane ->
                CraneModeDisplay = 'Single-crane mode'
            ; CraneModeDisplay = 'Multi-crane mode'
            )
        ; CraneModeDisplay = ''
        ),
        format_time_msg('Execution time: ~w seconds', ExecutionTime, TimeMsg),
        format_msg('Total delay: ~w', ShortestDelay, DelayMsg),
        ( CraneModeDisplay \= '' ->
            MessagesRaw = [AlgoSelectionMsg, SelectionReasonStr, CraneModeDisplay, TimeMsg, DelayMsg]
        ;   MessagesRaw = [AlgoSelectionMsg, SelectionReasonStr, TimeMsg, DelayMsg]
        )
    ;   % Manual mode: conditional display based on single-crane performance
        ( DelaySingle =:= 0 ->
            % Single-crane was sufficient - show only single-crane results
            format_time_msg('Time to generate the shortest delay solution (secs): ~w', ExecTimeSingle, SingleTimeMsg),
            format_msg('Single-crane total delay: ~w', DelaySingle, SingleDelayMsg),
            MessagesRaw = ['Running single-crane test...', SingleTimeMsg, SingleDelayMsg]
        ;
            % Multi-crane needed - show only multi-crane results
            format_time_msg('Time to generate the shortest delay solution (secs): ~w', ExecutionTime, MultiTimeMsg),
            format_msg('Multi-crane total delay: ~w', ShortestDelay, MultiDelayMsg),
            MessagesRaw = ['Delays detected with single-crane, applying multi-crane...', MultiTimeMsg, MultiDelayMsg]
        )
    ),
    
    % Convert raw items (which may be atoms) to strings
    maplist(atom_string_safe, MessagesRaw, Messages),
    triplets_to_dicts(SeqTriplets, SeqDicts),
    Result = _{
        schedule: SeqDicts,
        totalDelay: ShortestDelay,
        executionTime: ExecutionTime,
        messages: Messages,
        selectedAlgorithm: SelectedAlgoStr,
        selectionReason: SelectionReasonStr
    }.

% Helpers to format messages safely
format_msg(Format, Arg, Out) :-
    catch(format(atom(A), Format, [Arg]), _, A = 'format_error'),
    atom_string(A, Out).

format_time_msg(Format, Time, Out) :-
    % Present time with high precision
    catch(format(atom(A), Format, [Time]), _, A = 'format_error'),
    atom_string(A, Out).

atom_string_safe(X, S) :-
    ( string(X) -> S = X
    ; atom(X) -> atom_string(X, S)
    ; number(X) -> number_string(X, S)
    ; catch(term_to_atom(X, A), _, A = 'unserializable'), atom_string(A, S)
    ).

process_vessels([], _, _, []).
process_vessels([V|Rest], CraneCapacity, MaxCranes, [_|Facts]) :-
    VesselName = V.vesselIMO,
    ETAString = V.eta,
    ETDString = V.etd,
    CargoManifests = V.get(cargoManifests, []),


    datetime_to_hour(ETAString, ETAHour),
    datetime_to_hour(ETDString, ETDHour),

    % Conta containers por tipo
    count_cargo(CargoManifests, loading, NLoading),
    count_cargo(CargoManifests, unloading, NUnloading),

    % Calcula tempos (horas ou qualquer unidade que uses)
    compute_loading_unloading(NLoading, NUnloading, CraneCapacity, LoadingTime, UnloadingTime),

    % Cria facto vessel(..., MaxCranes) in both contexts for compatibility
    assertz(vessel(VesselName, ETAHour, ETDHour, UnloadingTime, LoadingTime, MaxCranes)),
    assertz(automatic_controller:vessel(VesselName, ETAHour, ETDHour, UnloadingTime, LoadingTime, MaxCranes)),

    with_output_to(user_error, format("Fato criado: vessel(~w, ~2f, ~2f, ~2f, ~2f, ~w)~n",
        [VesselName, ETAHour, ETDHour, LoadingTime, UnloadingTime, MaxCranes])),
    with_output_to(user_error, format("  Containers: Loading=~w, Unloading=~w, CraneCapacity=~w~n",
        [NLoading, NUnloading, CraneCapacity])),

    process_vessels(Rest, CraneCapacity, MaxCranes, Facts).

% Conta quantos containers existem para cada tipo de manifest
count_cargo([], _, 0).
count_cargo([M|Rest], TypeAtom, Count) :-
    string_lower(M.manifestType, ManifestType), 
    Entries = M.get(entries, []),
    length(Entries, NumEntries),
    atom_string(TypeAtom, TypeString), 
    (ManifestType = TypeString -> ThisCount = NumEntries ; ThisCount = 0),
    count_cargo(Rest, TypeAtom, OtherCount),
    Count is ThisCount + OtherCount.

% Calcula tempos de carga/descarga (mnimo de 1 hora para operações não-zero)
compute_loading_unloading(NLoading, NUnloading, CraneCapacity, LoadingTime, UnloadingTime) :-
    (CraneCapacity =:= 0 -> EffectiveCap = 1 ; EffectiveCap = CraneCapacity),
    LoadingTimeRaw is NLoading / EffectiveCap,
    UnloadingTimeRaw is NUnloading / EffectiveCap,

    (NLoading > 0 ->
        ceiling(LoadingTimeRaw, LoadingTime1)
    ;
        LoadingTime1 = 0
    ),

    (NUnloading > 0 ->
        ceiling(UnloadingTimeRaw, UnloadingTime1)
    ;
        UnloadingTime1 = 0
    ),


    % Se há containers mas o tempo é < 1, usar 1 hora como mnimo
    (NLoading > 0, LoadingTime1 < 1 -> LoadingTime = 1 ; LoadingTime = LoadingTime1),
    (NUnloading > 0, UnloadingTime1 < 1 -> UnloadingTime = 1 ; UnloadingTime = UnloadingTime1).


datetime_to_hour(DateTimeStr, HourDecimal) :-
    sub_atom(DateTimeStr, _, _, After, "T"), 
    sub_atom(DateTimeStr, _, After, 0, TimePart),
    split_string(TimePart, ":", "", [HStr, MStr | _]),
    number_string(H, HStr),
    number_string(M, MStr),
    HourDecimal is H + (M / 60).

% generate_crane_names/2: gera lista de nomes de cranes baseado no número OU usa lista fornecida
generate_crane_names(Cranes, Names) :-
    is_list(Cranes),
    !,
    maplist(extract_crane_name, Cranes, Names).

generate_crane_names(N, Names) :-
    number(N),
    N > 0,
    generate_crane_names_helper(1, N, Names).

extract_crane_name(Crane, Name) :-
    Name = Crane.get(name, 'Unknown Crane').

generate_crane_names_helper(Current, Max, []) :- Current > Max, !.
generate_crane_names_helper(Current, Max, [Name|Rest]) :-
    Current =< Max,
    format(atom(Name), 'STS Crane ~w', [Current]),
    Next is Current + 1,
    generate_crane_names_helper(Next, Max, Rest).


triplets_to_dicts([], []).

% handle 3-field tuples
triplets_to_dicts([(V, TIn, TEnd)|Rest], [Dict|DictsRest]) :-
    \+ (V, TIn, TEnd) = (_, _, _, _),
    \+ (V, TIn, TEnd) = (_, _, _, _, _),
    sanitize_value(TIn, SIn), sanitize_value(TEnd, SEnd),
    Dict = _{ vessel: V, start: SIn, end: SEnd },
    triplets_to_dicts(Rest, DictsRest).

% handle 5-field tuples (V, TIn, TEnd, Exec, N) - MUST come before 4-field
triplets_to_dicts([(V, TIn, TEnd, _Exec, N)|Rest], [Dict|DictsRest]) :-
    sanitize_value(TIn, SIn), sanitize_value(TEnd, SEnd),
    sanitize_value(N, NumCranes),
    % Try to use real cranes from available_cranes/1, otherwise generate names
    ( available_cranes(CranesList), CranesList \= [] ->
        generate_crane_names(CranesList, CraneNames)
    ;
        generate_crane_names(NumCranes, CraneNames)
    ),
    with_output_to(user_error, format('~nDEBUG triplets_to_dicts: Vessel=~w, N=~w, NumCranes=~w, CraneNames=~w~n', [V, N, NumCranes, CraneNames])),
    Dict = _{ vessel: V, start: SIn, end: SEnd, numCranes: NumCranes, craneNames: CraneNames },
    triplets_to_dicts(Rest, DictsRest).

% handle 4-field tuples (V, TIn, TEnd, Exec) - comes after 5-field
triplets_to_dicts([(V, TIn, TEnd, _Exec)|Rest], [Dict|DictsRest]) :-
    sanitize_value(TIn, SIn), sanitize_value(TEnd, SEnd),
    Dict = _{ vessel: V, start: SIn, end: SEnd },
    triplets_to_dicts(Rest, DictsRest).

% Fallback: convert any unexpected element to a string representation
triplets_to_dicts([Other|Rest], [Dict|DictsRest]) :-
    catch(term_to_atom(Other, A), _, A = 'unserializable_element'),
    Dict = _{ vessel: A, start: A, end: A },
    triplets_to_dicts(Rest, DictsRest).


% sanitize_value(+Value, -Sanitized)
% Convert Prolog compound tuples (e.g., (2,2,7)) into JSON-friendly lists of numbers,
% convert numeric strings/atoms to numbers, and leave numbers as-is.
sanitize_value(Value, Value) :- number(Value), !.
sanitize_value(Value, Out) :- string(Value), !,
    ( catch(number_string(N, Value), _, fail) -> Out = N ; Out = Value ).
sanitize_value(Value, Out) :- atom(Value), !,
    atom_string(Value, S),
    ( catch(number_string(N2, S), _, fail) -> Out = N2
    ; % try to parse comma-separated/tuple-like atom
      ( sub_string(S, _, _, _, ",") -> split_string(S, ",", " \t\n()", Parts), maplist(string_to_number_or_string, Parts, Converted), Out = Converted
      ; Out = S
      )
    ).
sanitize_value(Value, Out) :-
    compound(Value), !,
    Value =.. [_|Args],
    maplist(sanitize_value, Args, Converted),
    ( Converted = [Single] -> Out = Single ; Out = Converted ).

string_to_number_or_string(Str, Num) :-
    normalize_space(string(S), Str),
    ( catch(number_string(N, S), _, fail) -> Num = N ; Num = S ).

% Helper predicates for rebalancing mode
setup_dock_fact(DockDict) :-
    NameRaw = DockDict.get(name, ""),
    ( string(NameRaw) -> atom_string(Name, NameRaw) ; Name = NameRaw ),
    OpRaw = DockDict.get(medianOperationalCapacity, 0),
    ( number(OpRaw) -> OpCap = OpRaw ; ( catch(number_string(OpCap, OpRaw), _, OpCap = 0) ) ),
    assertz(rebalancing_algorithm:dock(Name, OpCap)).

process_vessels_for_rebalancing([], _).
process_vessels_for_rebalancing([V|Rest], _CraneCapacity) :-
    VesselIMO = V.vesselIMO,
    ETAString = V.eta,
    ETDString = V.etd,
    CargoManifests = V.get(cargoManifests, []),
    
    datetime_to_hour(ETAString, ETAHour),
    datetime_to_hour(ETDString, ETDHour),
    
    count_cargo(CargoManifests, loading, NLoading),
    count_cargo(CargoManifests, unloading, NUnloading),
    TotalContainers is NLoading + NUnloading,
    
    ETAInt is ceiling(ETAHour),
    ETDInt is ceiling(ETDHour),
    
    assertz(rebalancing_algorithm:vessels(VesselIMO, ETAInt, ETDInt, TotalContainers)),
    
    with_output_to(user_error, format("Rebalancing vessel: ~w (ETA=~w, ETD=~w, Containers=~w)~n",
        [VesselIMO, ETAInt, ETDInt, TotalContainers])),
    
    process_vessels_for_rebalancing(Rest, _).