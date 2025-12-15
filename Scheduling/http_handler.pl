:- module(http_handler, []).
:- use_module(library(http/http_client)).
:- use_module(library(http/json)).
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_parameters)).
:- use_module('Modules/genetic_controller.pl').
:- use_module('Modules/rebalancing_controller.pl').
:- consult('Algorithms/vessel_schedule.pl').
:- consult('Algorithms/improved_vessel_schedule.pl').


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
    http_parameters(Request, [algorithm(AlgParam, [optional(true)])]),
    (   (get_dict(algorithm, Dict, AlgJson) -> true ; AlgJson = '' ),
        (AlgParam \= '' -> Algorithm = AlgParam ; (AlgJson \= '' -> Algorithm = AlgJson ; Algorithm = default))
    ),
    with_output_to(user_error, format('Selected algorithm: ~w~n', [Algorithm])),
    ( get_dict(maxCranes, Dict, MaxCranes) -> true ; MaxCranes = 1 ),
    ( process_data_with_algorithm(Algorithm, Dict, Result, MaxCranes)
    -> (
            with_output_to(user_error, format('Result to reply: ~w~n', [Result])),
            reply_json_dict(_{status: "ok", schedule: Result})
       )
    ; reply_json_dict(_{error: "processing_failed"}, [status(500)])
    ).


% process_data_with_algorithm(+Algorithm, +Dict, -Result)
% Dispatches to the selected algorithm implementation.
process_data_with_algorithm(Algorithm, Dict, Result, MaxCranes) :-
    retractall(vessel(_,_,_,_,_,_)),
    Notifications = Dict.vesselVisitNotifications,
    Crane = Dict.assignedCrane,
    CraneCapacity = Crane.operationalCapacity,
    process_vessels(Notifications, CraneCapacity, MaxCranes, _),
    % First run a single-crane measurement to collect baseline stats for the popup
    obtain_seq_shortest_delay(_SeqSingle, DelaySingle, ExecTimeSingle),
    % Now run the requested algorithm to obtain the final sequence (may be multi-crane)
    downcase_atom(Algorithm, AlgorithmAtom),
    (   AlgorithmAtom = 'improved'
    ->  obtain_seq_shortest_delay_improved_multi(SeqTriplets, ShortestDelay, ExecutionTime, MaxCranes)
    ;   obtain_seq_shortest_delay_multi(SeqTriplets, ShortestDelay, ExecutionTime, MaxCranes)
    ),
    % Build human-friendly messages for the frontend popup
    % Evaluate formatted messages into strings before assembling the list
    format_time_msg('Time to generate the shortest delay solution (secs): ~w', ExecTimeSingle, SingleTimeMsg),
    format_msg('Single-crane total delay: ~w', DelaySingle, SingleDelayMsg),
    format_time_msg('Time to generate the shortest delay solution (secs): ~w', ExecutionTime, MultiTimeMsg),
    format_msg('Multi-crane total delay: ~w', ShortestDelay, MultiDelayMsg),
    ( DelaySingle =:= 0 ->
        SingleMsg = ['Running single-crane test...', SingleTimeMsg, SingleDelayMsg, 'Single-crane was sufficient, no multi-crane needed.']
    ;
        SingleMsg = ['Running single-crane test...', SingleTimeMsg, SingleDelayMsg, 'Delays detected with single-crane, applying multi-crane...']
    ),
    MultiMsg = [MultiTimeMsg, MultiDelayMsg],
    append(SingleMsg, MultiMsg, MessagesRaw),
    % Convert raw items (which may be atoms) to strings
    maplist(atom_string_safe, MessagesRaw, Messages),
    triplets_to_dicts(SeqTriplets, SeqDicts),
    Result = _{
        schedule: SeqDicts,
        totalDelay: ShortestDelay,
        executionTime: ExecutionTime,
        messages: Messages
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

    % Cria facto vessel(..., MaxCranes)
    assertz(vessel(VesselName, ETAHour, ETDHour, UnloadingTime, LoadingTime, MaxCranes)),

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


triplets_to_dicts([], []).

% handle 3-field tuples
triplets_to_dicts([(V, TIn, TEnd)|Rest], [Dict|DictsRest]) :-
    sanitize_value(TIn, SIn), sanitize_value(TEnd, SEnd),
    Dict = _{ vessel: V, start: SIn, end: SEnd },
    triplets_to_dicts(Rest, DictsRest).

% handle 4-field tuples (V, TIn, TEnd, Exec)
triplets_to_dicts([(V, TIn, TEnd, _Exec)|Rest], [Dict|DictsRest]) :-
    sanitize_value(TIn, SIn), sanitize_value(TEnd, SEnd),
    Dict = _{ vessel: V, start: SIn, end: SEnd },
    triplets_to_dicts(Rest, DictsRest).

% handle 5-field tuples (V, TIn, TEnd, Exec, N)
triplets_to_dicts([(V, TIn, TEnd, _Exec, _N)|Rest], [Dict|DictsRest]) :-
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