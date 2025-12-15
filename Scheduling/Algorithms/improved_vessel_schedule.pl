:- dynamic vessel/6.

% Vessel facts: (Name, TIn, TDep, TUnload, TLoad, MaxCranes)
vessel(va, 6, 63, 10, 16,3).
vessel(vb, 23, 50, 9, 7,3).
vessel(vc, 8, 40, 5, 12,3).
vessel(vd, 27, 40, 0, 8,3).
vessel(ve, 36, 70, 12, 0,3).
vessel(vf, 40, 60, 8, 6,3).
vessel(vg, 52, 80, 9, 10,3).
vessel(vi, 61, 90, 13, 8,3).
vessel(vj, 74, 100, 7, 7,3).
vessel(vk, 81, 110, 6, 8,3).
%vessel(vl, 90, 140, 22, 18,5).
%vessel(vm, 112, 140, 8, 7,5).
%vessel(vn, 82, 135, 13, 12,5).

% Safe logging helper: avoid exceptions if user_error/CGI stream is unavailable
safe_log_improved(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

% Convert an ordered list of vessels into triplets of (V, TInUnload, TEndLoad)
sequence_temporization_improved(LV,SeqTriplets):-
    sequence_temporization1_improved(0,LV,SeqTriplets).

sequence_temporization1_improved(EndPrevSeq,[V|LV],[(V,TInUnload,TEndLoad)|SeqTriplets]):-
    vessel(V,TIn,_,TUnload,TLoad,_),
    ( (TIn> EndPrevSeq,!, TInUnload is TIn); TInUnload is EndPrevSeq+1),
    TEndLoad is TInUnload + TUnload+TLoad -1,
    sequence_temporization1_improved(TEndLoad,LV,SeqTriplets).

sequence_temporization1_improved(_,[],[]).


% Sum delays from a sequence of triplets
sum_delays_improved([],0).
sum_delays_improved([(V,_,TEndLoad)|LV],S):-
    vessel(V,_,TDep,_,_,_), TPossibleDep is TEndLoad+1,
    ( (TPossibleDep>TDep,!,SV is TPossibleDep-TDep); SV is 0),
    sum_delays_improved(LV,SLV),
    S is SV+SLV.


% -------------------------
% Greedy scheduler by slackRel
% (SLACK-REL ALGORITHM REMOVED)


% Greedy insertion order
greedy_order_by_insertion(LV, OrderedLV) :-
    greedy_insertion_build(LV, [], OrderedLV).

greedy_insertion_build([], Acc, Acc).
greedy_insertion_build(Rem, Acc, Ordered) :-
    (Acc = [] -> CurrD = 0; (sequence_temporization_improved(Acc,AccTrip), sum_delays_improved(AccTrip,CurrD))),
    findall(Inc-V, (
        member(V, Rem),
        append(Acc, [V], NewSeqV),
        sequence_temporization_improved(NewSeqV, Trip),
        sum_delays_improved(Trip, D),
        Inc is D - CurrD
    ), Pairs),
    keysort(Pairs, Sorted),
    Sorted = [ _-BestV | _ ],
    select(BestV, Rem, Rem2),
    append(Acc, [BestV], Acc2),
    greedy_insertion_build(Rem2, Acc2, Ordered).


% Local improvement by pairwise swaps (hill-climbing)
local_improvement(SeqV, BestSeqV, BestDelay) :-
    sequence_temporization_improved(SeqV, Trip),
    sum_delays_improved(Trip, Delay),
    local_swap_optimize(SeqV, Delay, BestSeqV, BestDelay).

local_swap_optimize(Seq, Delay, BestSeq, BestDelay) :-
    length(Seq, N),
    findall(D2-Swapped, (
        between(1, N, I), Jstart is I+1, between(Jstart, N, J),
        swap_positions(Seq, I, J, Swapped),
        sequence_temporization_improved(Swapped, T2),
        sum_delays_improved(T2, D2)
    ), Results),
    ( Results = [] -> BestSeq = Seq, BestDelay = Delay
    ; keysort(Results, Sorted), Sorted = [MinD-BestCandidate|_],
        (MinD < Delay -> local_swap_optimize(BestCandidate, MinD, BestSeq, BestDelay)
        ; BestSeq = Seq, BestDelay = Delay)
    ).

% swap_positions: swap elements at positions I and J (1-based)
swap_positions(Seq, I, J, SeqOut) :-
    nth1(I, Seq, ElemI), nth1(J, Seq, ElemJ),
    set_nth1(Seq, I, ElemJ, Temp),
    set_nth1(Temp, J, ElemI, SeqOut).

set_nth1([_|T], 1, Elem, [Elem|T]).
set_nth1([H|T], N, Elem, [H|R]) :- N>1, N1 is N-1, set_nth1(T, N1, Elem, R).


% Improved scheduler wrapper: insertion + local improvement
schedule_greedy_improved(LV, FinalSeqTriplets, FinalDelay, TimeSecs) :-
    get_time(T0),
    greedy_order_by_insertion(LV, OrdLV),
    sequence_temporization_improved(OrdLV, OrdTrip), sum_delays_improved(OrdTrip, _OrdDelay),
    local_improvement(OrdLV, BestSeqV, BestDelay),
    sequence_temporization_improved(BestSeqV, FinalSeqTriplets),
    FinalDelay = BestDelay,
    get_time(T1), TimeSecs is T1 - T0.


obtain_seq_shortest_delay_improved(SeqTriplets, DelayHours, ExecutionTime) :-
    findall(V, vessel(V,_,_,_,_,_), LV),
    schedule_greedy_improved(LV, SeqTriplets, DelayHours, TimeSecs),
    ExecutionTime = TimeSecs,
    safe_log_improved('Time to generate the improved schedule (secs): ~w~n', [TimeSecs]).


% ---------------- Escalonamento (multi-cranes) para improved ----------------

% build_seq_quad_1crane_improved/3: converte triplets para quadruplets com 1 crane
build_seq_quad_1crane_improved([], [], []).
build_seq_quad_1crane_improved([(V, TIn, TEnd)|T], [(V, TIn, TEnd, ExecTime, 1)|QT], [1|CT]) :-
    vessel(V, _, _, TUnload, TLoad, _),
    ExecTime is TUnload + TLoad,
    build_seq_quad_1crane_improved(T, QT, CT).

% obtain_seq_shortest_delay_improved_multi/3: wrapper multi-crane para improved
obtain_seq_shortest_delay_improved_multi(SeqQuad, DelayBest, CranesAlloc) :-
    % Obter a melhor sequência com 1 crane usando o algoritmo greedy improved
    findall(V, vessel(V,_,_,_,_,_), LV),
    schedule_greedy_improved(LV, SeqTriplets, Delay1Crane, _),
    
    % Verificar se todos os vessels permitem apenas 1 crane
    findall(M, vessel(_, _, _, _, _, M), Ms),
    max_list(Ms, MaxCraneAllowed),
    ( MaxCraneAllowed =< 1 ->
        build_seq_quad_1crane_improved(SeqTriplets, SeqQuad, CranesAlloc),
        DelayBest = Delay1Crane,
        safe_log_improved('All vessels allow only 1 crane; returning single-crane solution.~n', [])
    ;
        ( Delay1Crane =:= 0 ->
            build_seq_quad_1crane_improved(SeqTriplets, SeqQuad, CranesAlloc),
            DelayBest = Delay1Crane,
            safe_log_improved('Single-crane solution without delays.~n', [])
        ;
            apply_multi_cranes_improved(SeqTriplets, SeqQuad, DelayBest, CranesAlloc)
        )
    ).

% Wrapper de compatibilidade: obtain_seq_shortest_delay_improved_multi/4
obtain_seq_shortest_delay_improved_multi(SeqQuad, DelayBest, ExecutionTime, MaxCranes) :-
    get_time(Ti),
    % Obter a melhor sequência com 1 crane
    findall(V, vessel(V,_,_,_,_,_), LV),
    schedule_greedy_improved(LV, SeqSingle, DelaySingle, _),
    
    ( DelaySingle =:= 0 ->
        % single-crane already optimal, build quad with 1 crane each
        build_seq_quad_1crane_improved(SeqSingle, SeqQuad, _),
        DelayBest = DelaySingle
    ; MaxCranes =< 1 ->
        % caller requested testing only up to 1 crane
        build_seq_quad_1crane_improved(SeqSingle, SeqQuad, _),
        DelayBest = DelaySingle,
        safe_log_improved('MaxCranes <= 1: skipping multi-crane search and returning single-crane solution.~n', [])
    ;
        % try N from 1..MaxCranes
        loop_try_N_improved_limit(1, MaxCranes, SeqSingle, BestSeq, BestDelay, _),
        SeqQuad = BestSeq,
        DelayBest = BestDelay
    ),
    get_time(Tf),
    ExecutionTime is Tf - Ti,
    safe_log_improved('Improved multi-crane search time (secs): ~w~n', [ExecutionTime]).

% apply_multi_cranes_improved/4: aplica alocação de cranes e calcula quad + atraso
apply_multi_cranes_improved(SeqTriplets, SeqQuad, DelayBest, CranesAlloc) :-
    % determinar o maximo de cranes permitido
    findall(M, vessel(_, _, _, _, _, M), Ms),
    max_list(Ms, MaxCrane),
    % iterar N de 1..MaxCrane e escolher a melhor alocação
    loop_try_N_improved(1, MaxCrane, SeqTriplets, SeqQuad, DelayBest, CranesAlloc).

% build_alloc_for_N_improved/3: constrói lista de alocações por navio
build_alloc_for_N_improved([], _N, []).
build_alloc_for_N_improved([(ID, _, _)|T], N, [A|AT]) :-
    vessel(ID, _, _, _, _, MaxC),
    (N =< MaxC -> A = N ; A = MaxC),
    build_alloc_for_N_improved(T, N, AT).

% loop_try_N_improved/6: itera N e escolhe melhor solução
% Case 1: CurrN valid and DelayRaw < 0 -> early stop, treat as zero
loop_try_N_improved(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    DelayRaw < 0,
    BestSeq = SeqQuad, BestDelay = 0, BestAlloc = Alloc.

% Case 2: CurrN valid and DelayRaw == 0 -> early stop
loop_try_N_improved(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    DelayRaw =:= 0,
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% Case 3: CurrN < MaxN and need to compare with next N
loop_try_N_improved(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN < MaxN,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    Next is CurrN + 1,
    loop_try_N_improved(Next, MaxN, SeqTriplets, SeqQuadNext, DelayNext, AllocNext),
    ( DelayRaw =< DelayNext -> BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc ; BestSeq = SeqQuadNext, BestDelay = DelayNext, BestAlloc = AllocNext ).

% Case 4: CurrN == MaxN (final N)
loop_try_N_improved(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% loop_try_N_improved_limit/6: similar to loop_try_N but limits to given MaxParam
% Case 1: CurrN valid and DelayRaw < 0 -> early stop, treat as zero
loop_try_N_improved_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    DelayRaw < 0,
    BestSeq = SeqQuad, BestDelay = 0, BestAlloc = Alloc.

% Case 2: CurrN valid and DelayRaw == 0 -> early stop
loop_try_N_improved_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    DelayRaw =:= 0,
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% Case 3: CurrN < MaxParam and need to compare with next N
loop_try_N_improved_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN < MaxParam,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    Next is CurrN + 1,
    loop_try_N_improved_limit(Next, MaxParam, SeqTriplets, SeqQuadNext, DelayNext, AllocNext),
    ( DelayRaw =< DelayNext -> BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc ; BestSeq = SeqQuadNext, BestDelay = DelayNext, BestAlloc = AllocNext ).

% Case 4: CurrN == MaxParam (final N)
loop_try_N_improved_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N_improved(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_improved(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_improved(SeqQuad, DelayRaw),
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% sequence_temporization_multi_improved/3: produz quadrupletos com multi-cranes
sequence_temporization_multi_improved([], [], []).
sequence_temporization_multi_improved([(V, TIn, _TEnd)|VTs], [N|NCs], [(V, TInUnload, TEndLoad, ExecTime, N)|SeqQuad]) :-
    vessel(V, _, _, TUnload, TLoad, _),
    Total is TUnload + TLoad,
    ExecTimeRaw is (Total + N - 1) // N, % ceil division
    % Garantir que ExecTime seja pelo menos 1
    (ExecTimeRaw < 1 -> ExecTime = 1 ; ExecTime = ExecTimeRaw),
    TInUnload is TIn,
    TEndLoad is TInUnload + ExecTime - 1,
    sequence_temporization_multi_improved(VTs, NCs, SeqQuad).

% sum_delays_multi_improved/2: calcula atraso total para quadrupletos multi-cranes
sum_delays_multi_improved([], 0).
sum_delays_multi_improved([(V, _, TEndLoad, _ExecTime, _NC)|LV], S) :-
    vessel(V, _, TDep, _, _, _),
    TPossibleDep is TEndLoad + 1,
    % only count non-negative tardiness
    (TPossibleDep > TDep -> SV is TPossibleDep - TDep ; SV = 0),
    sum_delays_multi_improved(LV, SLV),
    S is SV + SLV.


% ---------------- Predicado de Teste ----------------
% run_test_single_improved/0: executa teste rápido para single-crane improved e regista resultado
run_test_single_improved :-
    obtain_seq_shortest_delay_improved(Seq, Delay, ExecTime),
    safe_log_improved('Single-crane improved schedule: ~w~n', [Seq]),
    safe_log_improved('Single-crane improved total delay: ~w~n', [Delay]),
    safe_log_improved('Execution time: ~w secs~n', [ExecTime]).

% run_test_multi_improved/0: executa teste rápido para multi-crane improved e regista resultado
run_test_multi_improved :-
    obtain_seq_shortest_delay_improved_multi(SeqQuad, Delay, CranesAlloc),
    safe_log_improved('Multi-crane improved schedule: ~w~n', [SeqQuad]),
    safe_log_improved('Multi-crane improved total delay: ~w~n', [Delay]),
    safe_log_improved('Cranes allocated per vessel: ~w~n', [CranesAlloc]).

% ---------------- Predicado de Testes Globais ----------------
% run_all_tests_improved/0: executa bateria global de testes (single + multi) para improved
run_all_tests_improved :-
    safe_log_improved('--- Global Test for Improved Vessel Scheduling ---~n', []),

    % Primeiro, testar single-crane improved
    safe_log_improved('Running single-crane improved test...~n', []),
    obtain_seq_shortest_delay_improved(SeqSingle, DelaySingle, ExecTimeSingle),
    safe_log_improved('Single-crane improved schedule: ~w~n', [SeqSingle]),
    safe_log_improved('Single-crane improved total delay: ~w~n', [DelaySingle]),
    safe_log_improved('Execution time: ~w secs~n', [ExecTimeSingle]),

    % Antes de chamar multi-crane, verificar se alguma embarcação permite >1 crane
    findall(Mx, vessel(_, _, _, _, _, Mx), MsAll),
    max_list(MsAll, MaxCraneAllowed),
    ( MaxCraneAllowed =< 1 ->
        % Se todas as embarcações permitem no max 1 crane, não correr a lógica multi
        safe_log_improved('All vessels restrict max cranes to 1; skipping multi-crane search.~n', []),
        build_seq_quad_1crane_improved(SeqSingle, SeqMulti, CranesAlloc),
        DelayMulti = DelaySingle
    ;
        % Verificar se há atrasos para decidir reporte
        (DelaySingle =:= 0 ->
            safe_log_improved('Single-crane was sufficient, no multi-crane needed.~n', [])
        ;
            safe_log_improved('Delays detected with single-crane, applying multi-crane...~n', [])
        ),
        % Testar multi-crane
        obtain_seq_shortest_delay_improved_multi(SeqMulti, DelayMulti, CranesAlloc)
    ),

    % Unificar impressão dos resultados multi-crane
    safe_log_improved('Multi-crane improved schedule: ~w~n', [SeqMulti]),
    safe_log_improved('Multi-crane improved total delay: ~w~n', [DelayMulti]),
    safe_log_improved('Cranes allocated per vessel: ~w~n', [CranesAlloc]),

    % Conferir consistência
    (DelayMulti =< DelaySingle ->
        safe_log_improved('Verification: Multi-crane did not increase delays.~n', [])
    ;
        safe_log_improved('Alert: Multi-crane caused more delay than single-crane!~n', [])
    ),

    safe_log_improved('--- End of global test for improved ---~n', []).