% Fatos `vessel`: (Nome, TIn, TDep, TUnload, TLoad)
%vessel(va, 6, 63, 10, 16).
% safe_log_improved/2: registo seguro em user_error se disponível
safe_log_improved(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

% sequence_temporization_improved/2: produz triplets em lista [[V,TIU,TEL],...] a partir da ordem de navios
sequence_temporization_improved(LV,SeqTriplets):-
    sequence_temporization1_improved(0,LV,SeqTriplets).

sequence_temporization1_improved(EndPrevSeq,[V|LV],[[V,TInUnload,TEndLoad]|SeqTriplets]):-
    vessel(V, _Dock, TIn, _TDep, TUnload, TLoad),
    ( (TIn> EndPrevSeq,!, TInUnload is TIn); TInUnload is EndPrevSeq+1),
    TEndLoad is TInUnload + TUnload+TLoad -1,
    sequence_temporization1_improved(TEndLoad,LV,SeqTriplets).

sequence_temporization1_improved(_,[],[]).

% sum_delays_improved/2: calcula atraso total para sequência em forma de lista
sum_delays_improved([],0).
sum_delays_improved([[V,_,TEndLoad]|LV],S):-
    vessel(V, _, _, TDep, _, _), TPossibleDep is TEndLoad+1,
    ( (TPossibleDep>TDep,!,SV is TPossibleDep-TDep); SV is 0),
    sum_delays_improved(LV,SLV),
    S is SV+SLV.

% greedy_order_by_insertion/2: constrói ordem por inserção gulosa (1 crane)
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

% local_improvement/3: melhora sequência por trocas par-a-par (1 crane)
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

% swap_positions/4 e set_nth1/3: utilitários para trocar elementos e definir o n-ésimo
swap_positions(Seq, I, J, SeqOut) :-
    nth1(I, Seq, ElemI), nth1(J, Seq, ElemJ),
    set_nth1(Seq, I, ElemJ, Temp),
    set_nth1(Temp, J, ElemI, SeqOut).

set_nth1([_|T], 1, Elem, [Elem|T]).
set_nth1([H|T], N, Elem, [H|R]) :- N>1, N1 is N-1, set_nth1(T, N1, Elem, R).

% schedule_greedy_improved/4: cria e otimiza escalonamento para 1 crane
schedule_greedy_improved(LV, FinalSeqTriplets, FinalDelay, TimeSecs) :-
    get_time(T0),
    greedy_order_by_insertion(LV, OrdLV),
    sequence_temporization_improved(OrdLV, OrdTrip), sum_delays_improved(OrdTrip, _OrdDelay),
    local_improvement(OrdLV, BestSeqV, BestDelay),
    sequence_temporization_improved(BestSeqV, FinalSeqTriplets),
    FinalDelay = BestDelay,
    get_time(T1), TimeSecs is T1 - T0.

% obtain_seq_shortest_delay_improved/3: wrapper do utilizador que retorna triplets em lista
obtain_seq_shortest_delay_improved(SeqTriplets, DelayHours, ExecutionTime) :-
    findall(V, vessel(V,_,_,_,_,_), LV),
    schedule_greedy_improved(LV, SeqTriplets, DelayHours, TimeSecs),
    ExecutionTime = TimeSecs,
    safe_log_improved('Time to generate the improved schedule (secs): ~w~n', [TimeSecs]).

% obtain_seq_shortest_delay_improved_multi/5: wrapper que tenta multi-cranes e regista resultado
obtain_seq_shortest_delay_improved_multi(SeqBetterQuadruplets, SShortestDelay, LCranesAlloc, Logs, Strategy) :-
    findall(V, vessel(V,_,_,_,_,_), AllVessels),
    length(AllVessels, NVessels),
    obtain_seq_shortest_delay_improved(SeqTripletsTuple, SDelay1Crane, _ExecutionTime),
    SeqTriplets = SeqTripletsTuple,
    ( (NVessels > 2, SDelay1Crane > 0) ->
        Strategy = 'multi_cranes',
        findall(Vv, vessel(Vv,_,_,_,_,_), LVAll),
        ( catch(schedule_greedy_improved_multi(LVAll, SeqBetterQuadruplets, SShortestDelay, _TExec), E, (safe_log_improved('Error in multi scheduler: ~w~n',[E]), fail)) ->
            extract_cranes_list(SeqBetterQuadruplets, LCranesAlloc),
            atomic_list_concat(['MULTI-CRANES ACTIVATED (', NVessels, ' vessels). Initial delay (1 crane): ', SDelay1Crane, '. Final delay: ', SShortestDelay], '', Msg0),
            Logs = [Msg0]
        ;
            Strategy = 'single_crane',
            SShortestDelay is SDelay1Crane,
            convert_triplets_to_quadruplets(SeqTriplets, 1, SeqBetterQuadruplets),
            extract_cranes_list(SeqBetterQuadruplets, LCranesAlloc),
            atomic_list_concat(['MULTI-CRANES attempt failed, using single-crane solution. Delay: ', SShortestDelay], '', MsgF),
            Logs = [MsgF]
        )
    ;
        Strategy = 'single_crane',
        SShortestDelay is SDelay1Crane,
        convert_triplets_to_quadruplets(SeqTriplets, 1, SeqBetterQuadruplets),
        extract_cranes_list(SeqBetterQuadruplets, LCranesAlloc),
        atomic_list_concat(['SINGLE-CRANE chosen. Delay: ', SShortestDelay], '', MsgS),
        Logs = [MsgS]
    ).

% sequence_temporization_improved_multi/3: calcula tempos quando cada navio tem NCranes atribuídos
sequence_temporization_improved_multi(LV, LCranes, SeqQuadruplets) :-
    sequence_temporization_improved_multi1(0, LV, LCranes, SeqQuadruplets).

sequence_temporization_improved_multi1(EndPrevSeq, [V|LV], [NCranes|LC], [[V, TInUnload, TEndLoad, NCranes]|Seq]) :-
    vessel(V, _Dock, TIn, _TDep, TUnload, TLoad),
    ( (TIn > EndPrevSeq, !, TInUnload is TIn) ; TInUnload is EndPrevSeq + 1 ),
    TProc0 is (TUnload + TLoad) // NCranes,
    ( TProc0 < 1 -> TProc is 1 ; TProc is TProc0 ),
    TEndLoad is TInUnload + TProc - 1,
    sequence_temporization_improved_multi1(TEndLoad, LV, LC, Seq).

sequence_temporization_improved_multi1(_, [], [], []).

% sum_delays_improved_multi/2: calcula atraso total para quadrupletos multi-cranes
sum_delays_improved_multi([], 0).
sum_delays_improved_multi([[V, _, TEndLoad, _]|LV], S) :-
    vessel(V, _, _, TDep, _, _),
    TPossibleDep is TEndLoad + 1,
    ( (TPossibleDep > TDep, !, SV is TPossibleDep - TDep) ; SV is 0 ),
    sum_delays_improved_multi(LV, SLV),
    S is SV + SLV.

% allowed_cranes_for_vessel/2: produz contagens candidatas de cranes para um navio
allowed_cranes_for_vessel(V, CNCandidates) :-
    ( current_predicate(vessel/6), vessel(V, DockID, _, _, _, _), current_predicate(dock/2), dock(DockID, Max) -> true
    ; ( current_predicate(dock/2) -> findall(M, dock(_, M), Ms), (Ms = [] -> Max = 2 ; max_list(Ms, Max)) ; Max = 2 )
    ),
        Max >= 1,
        findall(N, between(1, Max, N), CNCandidates).

% greedy_order_by_insertion_multi/3: inserção gulosa para sequência e alocação de guindastes
greedy_order_by_insertion_multi(LV, OrderedLV, OrderedLCranes) :-
    greedy_insertion_build_multi(LV, [], [], OrderedLV, OrderedLCranes).

greedy_insertion_build_multi([], AccSeq, AccCranes, AccSeq, AccCranes).
greedy_insertion_build_multi(Rem, AccSeq, AccCranes, Ordered, OrderedCranes) :-
    (AccSeq = [] -> CurrD = 0 ; (sequence_temporization_improved_multi(AccSeq, AccCranes, AccTrip), sum_delays_improved_multi(AccTrip, CurrD))),
    findall(Inc-(V-NC), (
        member(V, Rem),
        allowed_cranes_for_vessel(V, CNCandidates), member(NC, CNCandidates),
        append(AccSeq, [V], NewSeq), append(AccCranes, [NC], NewCranes),
        sequence_temporization_improved_multi(NewSeq, NewCranes, TripNew),
        sum_delays_improved_multi(TripNew, D),
        Inc is D - CurrD
    ), Pairs),
    keysort(Pairs, Sorted),
    Sorted = [_-(BestV-BestNC)|_],
    select(BestV, Rem, Rem2),
    append(AccSeq, [BestV], Acc2Seq),
    append(AccCranes, [BestNC], Acc2Cranes),
    greedy_insertion_build_multi(Rem2, Acc2Seq, Acc2Cranes, Ordered, OrderedCranes).

% local_improvement_multi/5: otimização local para sequências multi-guindaste
local_improvement_multi(SeqV, SeqLCranes, BestSeqV, BestLCranes, BestDelay) :-
    sequence_temporization_improved_multi(SeqV, SeqLCranes, Trip),
    sum_delays_improved_multi(Trip, Delay),
    local_swap_optimize_multi(SeqV, SeqLCranes, Delay, BestSeqV, BestLCranes, BestDelay).

local_swap_optimize_multi(Seq, LCr, Delay, BestSeq, BestLCr, BestDelay) :-
    length(Seq, N),
    findall(D2-(S2-L2), (
        between(1, N, I), Jstart is I+1, between(Jstart, N, J),
        swap_positions(Seq, I, J, S2), swap_positions(LCr, I, J, L2),
        sequence_temporization_improved_multi(S2, L2, T2), sum_delays_improved_multi(T2, D2)
    ), SwapResults),
    findall(Df-(Seqf-Lf), (
        between(1, N, K), nth1(K, LCr, C), nth1(K, Seq, V),
        allowed_cranes_for_vessel(V, CNCandidates), member(Cn, CNCandidates), Cn \= C,
        set_nth1(LCr, K, Cn, Lf), Seqf = Seq,
        sequence_temporization_improved_multi(Seqf, Lf, Tf), sum_delays_improved_multi(Tf, Df)
    ), FlipResults),
    append(SwapResults, FlipResults, Results),
    ( Results = [] -> BestSeq = Seq, BestLCr = LCr, BestDelay = Delay
    ; keysort(Results, Sorted), Sorted = [MinD-(CandSeq-CandLCr)|_],
        ( MinD < Delay -> local_swap_optimize_multi(CandSeq, CandLCr, MinD, BestSeq, BestLCr, BestDelay)
        ; BestSeq = Seq, BestLCr = LCr, BestDelay = Delay
        )
    ).

% schedule_greedy_improved_multi/4: cria e otimiza escalonamento multi-crane
schedule_greedy_improved_multi(LV, FinalSeqQuadruplets, FinalDelay, TimeSecs) :-
    get_time(T0),
    greedy_order_by_insertion_multi(LV, OrdLV, OrdLCranes),
    sequence_temporization_improved_multi(OrdLV, OrdLCranes, OrdTrip), sum_delays_improved_multi(OrdTrip, _OrdDelay),
    local_improvement_multi(OrdLV, OrdLCranes, BestSeqV, BestLCranes, BestDelay),
    sequence_temporization_improved_multi(BestSeqV, BestLCranes, FinalSeqQuadruplets),
    FinalDelay = BestDelay,
    get_time(T1), TimeSecs is T1 - T0.

% convert_triplets_to_quadruplets/3: converte tripletas em lista para quadrupletos com NC
convert_triplets_to_quadruplets([], _, []).
convert_triplets_to_quadruplets([[V, TIU, TEL]|T], N, [[V, TIU, TEL, N]|Q]) :-
    convert_triplets_to_quadruplets(T, N, Q).

% extract_cranes_list/2: extrai valores NC de quadrupletos
extract_cranes_list([], []).
extract_cranes_list([[_, _, _, NC]|T], [NC|L]) :-
    extract_cranes_list(T, L).


vessel(va, 6, 63, 10, 16,1).
vessel(vb, 23, 50, 9, 7,1).
vessel(vc, 8, 40, 5, 12,1).
vessel(vd, 27, 40, 0, 8,1).
vessel(ve, 36, 70, 12, 0,1).
vessel(vf, 40, 60, 8, 6,1).
vessel(vg, 52, 80, 9, 10,1).
vessel(vi, 61, 90, 13, 8,1).
vessel(vj, 74, 100, 7, 7,1).
vessel(vk, 81, 110, 6, 8,1).
vessel(vl, 90, 140, 22, 18,1).
vessel(vm, 112, 140, 8, 7,1).
vessel(vn, 82, 135, 13, 12,1).