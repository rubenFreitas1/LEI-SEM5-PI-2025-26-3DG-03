:- dynamic shortest_delay/2.
:- dynamic shortest_delay/2.
:- dynamic vessel/6.

% ---------------- Logging seguro ----------------
% safe_log/2: regista mensagens de forma segura (não falha se user_error indisponível)
safe_log(Format, Args) :-
catch(with_output_to(user_error, format(Format, Args)), _, true).

% ---------------- Escalonamento (1 crane) ----------------
% sequence_temporization/2: produz tripletas (V, TInUnload, TEndLoad) a partir da ordem de navios
sequence_temporization(LV, SeqTriplets) :-
    sequence_temporization1(0, LV, SeqTriplets).

sequence_temporization1(_, [], []).
% sequence_temporization1/3: auxiliar recursivo que calcula tempos sequenciais e o execution time
sequence_temporization1(EndPrevSeq, [V|LV], [(V, TInUnload, TEndLoad, ExecTime)|SeqTriplets]) :-
    % vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    vessel(V, TIn, _TDep, TUnload, TLoad, _MaxC),
    (TIn > EndPrevSeq -> TInUnload = TIn ; TInUnload is EndPrevSeq),
    ExecTime is TUnload + TLoad,
    TEndLoad is TInUnload + ExecTime,
    sequence_temporization1(TEndLoad, LV, SeqTriplets).

% sum_delays/2: calcula o atraso total (soma de atrasos por navio)
sum_delays([], 0).
sum_delays([(V, _, TEndLoad, _)|LV], S) :-
    % vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    vessel(V, _, TDep, _, _, _),
    TPossibleDep is TEndLoad + 1,
    % only count non-negative tardiness: SV = max(0, TPossibleDep - TDep)
    (TPossibleDep > TDep -> SV is TPossibleDep - TDep ; SV = 0),
    sum_delays(LV, SLV),
    S is SV + SLV.

% obtain_seq_shortest_delay/2: procura a permutação com atraso minimo (força bruta)
% obtain_seq_shortest_delay1/0: força-bruta procura permutações e atualiza shortest_delay
obtain_seq_shortest_delay1 :-
    retractall(shortest_delay(_, _)),
    % insert an initial sentinel best record; compare_shortest_delay will match any first arg
    asserta(shortest_delay(init, 100000)),
    findall(V, vessel(V, _, _, _, _, _), LV),
    permutation(LV, SeqV),
    sequence_temporization(SeqV, SeqTriplets),
    sum_delays(SeqTriplets, S),
    compare_shortest_delay(SeqTriplets, S),
    fail.

% obtain_seq_shortest_delay/3: mede o tempo de geração da melhor sequência
obtain_seq_shortest_delay(SeqBest, DelayBest, ExecutionTime) :-
    get_time(Ti),
    (obtain_seq_shortest_delay1 ; true),
    retract(shortest_delay(SeqBest, DelayBest)), !,
    get_time(Tf),
    TimeSecs is Tf - Ti,
    ExecutionTime = TimeSecs,
    safe_log('Time to generate the shortest delay solution (secs): ~w~n', [TimeSecs]).

% compatibilidade: manter obtain_seq_shortest_delay/2
obtain_seq_shortest_delay(SeqBest, DelayBest) :-
    obtain_seq_shortest_delay(SeqBest, DelayBest, _ExecutionTime).

% compare_shortest_delay/2: atualiza a melhor solução armazenada se S for menor
compare_shortest_delay(SeqTriplets, S) :-
    shortest_delay(_, SLowest),
    % store the raw delay (allow zero or negative values)
    (S < SLowest -> retract(shortest_delay(_, _)), asserta(shortest_delay(SeqTriplets, S)) ; true).

% clamp_nonneg(+Val, -NonNeg): garante que NonNeg >= 0
% clamp_nonneg removed: we now allow raw delays to be negative or zero

% ---------------- Escalonamento (multi-cranes) ----------------
% obtain_seq_shortest_delay_multi/3: wrapper que tenta solução multi-cranes (ou usa 1-crane)
obtain_seq_shortest_delay_multi(SeqQuad, DelayBest, CranesAlloc) :-
    obtain_seq_shortest_delay(SeqTriplets, Delay1Crane),
    % If all vessels allow at most 1 crane, skip multi-crane search and return single-crane result
    findall(M, vessel(_, _, _, _, _, M), Ms),
    max_list(Ms, MaxCraneAllowed),
    ( MaxCraneAllowed =< 1 ->
        build_seq_quad_1crane(SeqTriplets, SeqQuad, CranesAlloc),
        DelayBest = Delay1Crane,
        safe_log('All vessels allow only 1 crane; returning single-crane solution.~n', [])
    ;
        ( Delay1Crane =:= 0 ->
            build_seq_quad_1crane(SeqTriplets, SeqQuad, CranesAlloc),
            DelayBest = Delay1Crane,
            safe_log('Single-crane solution without delays.~n', [])
        ;
            apply_multi_cranes(SeqTriplets, SeqQuad, DelayBest, CranesAlloc)
        )
    ).

build_seq_quad_1crane([], [], []).
build_seq_quad_1crane([(V, TIn, TEnd, ExecTime)|T], [(V, TIn, TEnd, ExecTime, 1)|QT], [1|CT]) :-
    build_seq_quad_1crane(T, QT, CT).

    % Wrapper de compatibilidade: obtain_seq_shortest_delay_multi/4
    % Older HTTP handler expects a 4-arity predicate (Seq, Delay, ExecTime, MaxCranes).
    % We provide a thin wrapper that measures execution time and delegates to the
    % existing obtain_seq_shortest_delay_multi/3 implementation.
    obtain_seq_shortest_delay_multi(SeqQuad, DelayBest, ExecutionTime, MaxCranes) :-
        % Delegar para a pesquisa multi-crane melhorada que aceita um limite superior.
        obtain_seq_shortest_delay_improved_multi(SeqQuad, DelayBest, ExecutionTime, MaxCranes).

% apply_multi_cranes/4: aplica alocação de cranes por doca e calcula quad + atraso
% apply_multi_cranes/4: tenta alocações de 1..MaxCrane (parando cedo se delay = 0)
apply_multi_cranes(SeqTriplets, SeqQuad, DelayBest, CranesAlloc) :-
    % determinar o maximo de cranes permitido (a partir do campo maxCranes dos vessels)
    findall(M, vessel(_, _, _, _, _, M), Ms),
    max_list(Ms, MaxCrane),
    % iterar N de 1..MaxCrane e escolher a melhor alocação (pára se delay = 0)
    loop_try_N(1, MaxCrane, SeqTriplets, SeqQuad, DelayBest, CranesAlloc).

% build_alloc_for_N/3: dado SeqTriplets e um N global, constrói lista de alocações por navio
build_alloc_for_N([], _N, []).
build_alloc_for_N([(ID, _, _, _)|T], N, [A|AT]) :-
    % vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    vessel(ID, _, _, _, _, MaxC),
    (N =< MaxC -> A = N ; A = MaxC),
    build_alloc_for_N(T, N, AT).

% loop_try_N/6: itera N de CurrN até MaxN, computa schedule e escolhe melhor solução
% Case 1: CurrN valid and DelayRaw < 0 -> early stop, treat as zero
loop_try_N(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    DelayRaw < 0,
    BestSeq = SeqQuad, BestDelay = 0, BestAlloc = Alloc.

% Case 2: CurrN valid and DelayRaw == 0 -> early stop
loop_try_N(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    DelayRaw =:= 0,
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% Case 3: CurrN < MaxN and need to compare with next N
loop_try_N(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN < MaxN,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    Next is CurrN + 1,
    loop_try_N(Next, MaxN, SeqTriplets, SeqQuadNext, DelayNext, AllocNext),
    ( DelayRaw =< DelayNext -> BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc ; BestSeq = SeqQuadNext, BestDelay = DelayNext, BestAlloc = AllocNext ).

% Case 4: CurrN == MaxN (final N, no better found in previous clauses)
loop_try_N(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.


% ---------------- Pesquisa multi-crane melhorada (parametrizada) ----------------
% obtain_seq_shortest_delay_improved_multi/4:
%   SeqQuadOut - resulting schedule (quadruplets with Exec and N)
%   ShortestDelay - total delay for resulting schedule
%   ExecutionTime - seconds spent searching
%   MaxCranesParam - upper bound (tested N will be 1..MaxCranesParam)
obtain_seq_shortest_delay_improved_multi(SeqQuadOut, ShortestDelay, ExecutionTime, MaxCranesParam) :-
    get_time(Ti),
    % first compute best single-crane ordering (and time) using existing predicate
    obtain_seq_shortest_delay(SeqSingle, DelaySingle, _TimeSingle),
    ( DelaySingle =:= 0 ->
        % single-crane already optimal, build quad with 1 crane each
        build_seq_quad_1crane(SeqSingle, SeqQuadOut, _),
        ShortestDelay = DelaySingle
    ; MaxCranesParam =< 1 ->
        % caller requested testing only up to 1 crane: return single-crane quad
        build_seq_quad_1crane(SeqSingle, SeqQuadOut, _),
        ShortestDelay = DelaySingle,
        safe_log('MaxCranesParam <= 1: skipping multi-crane search and returning single-crane solution.~n', [])
    ;
        % try N from 1..MaxCranesParam (each N means trying that many cranes per vessel, capped by vessel.maxCranes)
        loop_try_N_limit(1, MaxCranesParam, SeqSingle, BestSeq, BestDelay, _),
        SeqQuadOut = BestSeq,
        ShortestDelay = BestDelay
    ),
    get_time(Tf),
    ExecutionTime is Tf - Ti,
    safe_log('Improved multi-crane search time (secs): ~w~n', [ExecutionTime]).

% loop_try_N_limit/6: similar to loop_try_N but limits to given MaxParam
% Case 1: CurrN valid and DelayRaw < 0 -> early stop, treat as zero
loop_try_N_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    DelayRaw < 0,
    BestSeq = SeqQuad, BestDelay = 0, BestAlloc = Alloc.

% Case 2: CurrN valid and DelayRaw == 0 -> early stop
loop_try_N_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    DelayRaw =:= 0,
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% Case 3: CurrN < MaxParam and need to compare with next N
loop_try_N_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN < MaxParam,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    Next is CurrN + 1,
    loop_try_N_limit(Next, MaxParam, SeqTriplets, SeqQuadNext, DelayNext, AllocNext),
    ( DelayRaw =< DelayNext -> BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc ; BestSeq = SeqQuadNext, BestDelay = DelayNext, BestAlloc = AllocNext ).

% Case 4: CurrN == MaxParam (final N)
loop_try_N_limit(CurrN, MaxParam, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxParam,
    build_alloc_for_N(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi(SeqQuad, DelayRaw),
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% sequence_temporization_multi/3: produz quadrupletos (V,TIU,TEnd,NC) dada alocação NC por navio
sequence_temporization_multi([], [], []).
% input SeqTriplets entries are (V, TIn, TEnd, ExecBase)
% output SeqQuad entries are (V, TInUnload, TEndLoad, ExecTime, N)
sequence_temporization_multi([(V, TIn, _TEnd, _ExecBase)|VTs], [N|NCs], [(V, TInUnload, TEndLoad, ExecTime, N)|SeqQuad]) :-
    % vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    vessel(V, _, _, TUnload, TLoad, _),
    Total is TUnload + TLoad,
    ExecTimeRaw is (Total + N - 1) // N, % ceil division
    % Garantir que ExecTime seja pelo menos 1 (minimo de 1 hora de operação)
    (ExecTimeRaw < 1 -> ExecTime = 1 ; ExecTime = ExecTimeRaw),
    TInUnload is TIn,
    TEndLoad is TInUnload + ExecTime - 1,
    sequence_temporization_multi(VTs, NCs, SeqQuad).

% sum_delays_multi/2: calcula atraso total para quadrupletos multi-cranes
sum_delays_multi([], 0).
sum_delays_multi([(V, _, TEndLoad, _ExecTime, _NC)|LV], S) :-
    % vessel(Name, TIn, TDep, TUnload, TLoad, MaxC)
    vessel(V, _, TDep, _, _, _),
    TPossibleDep is TEndLoad + 1,
    % only count non-negative tardiness: SV = max(0, TPossibleDep - TDep)
    (TPossibleDep > TDep -> SV is TPossibleDep - TDep ; SV = 0),
    sum_delays_multi(LV, SLV),
    S is SV + SLV.

% ---------------- Predicado de Teste ----------------
% run_test_single/0: executa teste rápido para single-crane e regista resultado
run_test_single :-
    obtain_seq_shortest_delay(Seq, Delay),
    safe_log('Single-crane schedule: ~w~n', [Seq]),
    safe_log('Single-crane total delay: ~w~n', [Delay]).

% run_test_multi/0: executa teste rápido para multi-crane e regista resultado
run_test_multi :-
    obtain_seq_shortest_delay_multi(SeqQuad, Delay, CranesAlloc),
    safe_log('Multi-crane schedule: ~w~n', [SeqQuad]),
    safe_log('Multi-crane total delay: ~w~n', [Delay]),
    safe_log('Cranes allocated per vessel: ~w~n', [CranesAlloc]).

% ---------------- Predicado de Testes Globais ----------------
% run_all_tests/0: executa bateria global de testes (single + multi)
run_all_tests :-
safe_log('--- Global Test for Vessel Scheduling ---~n', []),

% Primeiro, testar single-crane
    safe_log('Running single-crane test...~n', []),
    obtain_seq_shortest_delay(SeqSingle, DelaySingle),
    safe_log('Single-crane schedule: ~w~n', [SeqSingle]),
    safe_log('Single-crane total delay: ~w~n', [DelaySingle]),

    % Antes de chamar multi-crane, verificar se alguma embarcação permite >1 crane
    findall(Mx, vessel(_, _, _, _, _, Mx), MsAll),
    max_list(MsAll, MaxCraneAllowed),
    ( MaxCraneAllowed =< 1 ->
        % Se todas as embarcações permitem no max 1 crane, não correr a lógica multi
        safe_log('All vessels restrict max cranes to 1; skipping multi-crane search.~n', []),
        build_seq_quad_1crane(SeqSingle, SeqMulti, CranesAlloc),
        DelayMulti = DelaySingle
    ;
        % Verificar se há atrasos para decidir reporte
        (DelaySingle =:= 0 ->
            safe_log('Single-crane was sufficient, no multi-crane needed.~n', [])
        ;
            safe_log('Delays detected with single-crane, applying multi-crane...~n', [])
        ),
        % Testar multi-crane
        obtain_seq_shortest_delay_multi(SeqMulti, DelayMulti, CranesAlloc)
    ),

    % Unificar impressão dos resultados multi-crane (garante uso de SeqMulti/CranesAlloc em ambas branches)
    safe_log('Multi-crane schedule: ~w~n', [SeqMulti]),
    safe_log('Multi-crane total delay: ~w~n', [DelayMulti]),
    safe_log('Cranes allocated per vessel: ~w~n', [CranesAlloc]),

% Conferir consistência
(DelayMulti =< DelaySingle ->
    safe_log('Verification: Multi-crane did not increase delays.~n', [])
;
    safe_log('Alert: Multi-crane caused more delay than single-crane!~n', [])
),

safe_log('--- End of global test ---~n', []).

% (auxiliar de tempo de execução removido - os tempos de execução já não são impressos)

% ---------------- Base de Conhecimento ----------------

% Fatos `vessel`: vessel(Nome, TIn, TDep, TUnload, TLoad, maxCranes)

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