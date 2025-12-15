:-dynamic generations/1.
:-dynamic population/1.
:-dynamic prob_crossover/1.
:-dynamic prob_mutation/1.
:- dynamic stable_limit/1.
:- dynamic time_limit/1.
:- dynamic start_time/1.
:- dynamic vessel/5.
:- dynamic vessels/1.

% Vessel facts: vessel(Id, ProcessTime, ETA, ETD, MaxCranes)
vessel(va, 26, 6, 63, 3). 
vessel(vb, 16, 23, 50, 3). 
vessel(vc, 17, 8, 40, 3).
vessel(vd, 8, 27, 40, 3). 
%vessel(ve, 12, 36, 70, 3). 
%vessel(vf, 14, 40, 60, 3). 
%vessel(vg, 19, 52, 80, 3). 
%vessel(vi, 21, 61, 90, 3). 
%vessel(vj, 14, 74, 100, 3). 
%vessel(vk, 14, 81, 110, 3). 
%vessel(vl, 42, 90, 140, 3). 
%vessel(vm, 15, 112, 140, 3). 
%vessel(vn, 25, 82, 135, 3). 

% vessels(NVessels).
vessels(4).

% Safe logging helper
safe_log_genetic(Format, Args) :-
    catch(with_output_to(user_error, format(Format, Args)), _, true).

% parameters initialization
initialize_params(NG, PS, PCPercent, PMPercent, StableLimit, TimeLimit) :-
    (retract(generations(_));true), asserta(generations(NG)),
    (retract(population(_));true), asserta(population(PS)),
    PC is PCPercent / 100,
    PM is PMPercent / 100,
    (retract(prob_crossover(_));true), asserta(prob_crossover(PC)),
    (retract(prob_mutation(_));true), asserta(prob_mutation(PM)),
    (retract(stable_limit(_));true), asserta(stable_limit(StableLimit)),
    (retract(time_limit(_));true), assert(time_limit(TimeLimit)).

% ---------------- Single-crane genetic algorithm ----------------
generate_single(Result):-
    get_time(Start),
    asserta(start_time(Start)),
    generate_population(Pop),
    evaluate_population_single(Pop,PopValue),
    order_population(PopValue,PopOrd),
    generations(NG),
    generate_generation_single(0,NG,PopOrd,0,none,Best),
    return_best_solution_single(Best, Result).

generate_population(Pop):-
    population(PopSize),
    vessels(NumV),
    findall(Vessel,vessel(Vessel,_,_,_,_),VesselsList),
    generate_population(PopSize,VesselsList,NumV,Pop).

generate_population(0,_,_,[]):-!.
generate_population(PopSize,VesselsList,NumV,[Ind|Rest]):-
    PopSize1 is PopSize-1,
    generate_population(PopSize1,VesselsList,NumV,Rest),
    generate_individual(VesselsList,NumV,Ind),
    not(member(Ind,Rest)).    
generate_population(PopSize,VesselsList,NumV,L):-
    generate_population(PopSize,VesselsList,NumV,L).

generate_individual([G],1,[G]):-!.
generate_individual(VesselsList,NumV,[G|Rest]):-
    NumTemp is NumV + 1,
    random(1,NumTemp,N),
    remove(N,VesselsList,G,NewList),
    NumV1 is NumV-1,
    generate_individual(NewList,NumV1,Rest).

remove(1,[G|Rest],G,Rest).
remove(N,[G1|Rest],G,[G1|Rest1]):- N1 is N-1,
    remove(N1,Rest,G,Rest1).

% Evaluate population for single-crane
evaluate_population_single([],[]).
evaluate_population_single([Ind|Rest],[Ind*V|Rest1]):-
    evaluate_single(Ind,V),
    evaluate_population_single(Rest,Rest1).

evaluate_single(Seq,DelayTotal):-
    sequence_temporization_single(Seq,Triplets),
    sum_delays_single(Triplets,DelayTotal).

sequence_temporization_single(LV,SeqTriplets):-
    sequence_temporization1_single(0,LV,SeqTriplets).

sequence_temporization1_single(_,[],[]).
sequence_temporization1_single(EndPrevSeq,[V|LV],[(V,TInUnload,TEndLoad,ExecTime)|SeqTriplets]):-
    vessel(V,ProcessTime,TIn,_TDep,_MaxC),
    (TIn > EndPrevSeq -> TInUnload = TIn ; TInUnload is EndPrevSeq),
    ExecTime is ProcessTime,
    TEndLoad is TInUnload + ExecTime,
    sequence_temporization1_single(TEndLoad,LV,SeqTriplets).

sum_delays_single([],0).
sum_delays_single([(V,_,TEndLoad,_)|LV],S):-
    vessel(V,_,_,TDep,_),
    TPossibleDep is TEndLoad + 1,
    (TPossibleDep > TDep -> SV is TPossibleDep - TDep ; SV = 0),
    sum_delays_single(LV,SLV),
    S is SV + SLV.

order_population(PopValue,PopValueOrd):-
    bsort(PopValue,PopValueOrd).

bsort([X],[X]):-!.
bsort([X|Xs],Ys):-
    bsort(Xs,Zs),
    bchange([X|Zs],Ys).

bchange([X],[X]):-!.
bchange([X*VX,Y*VY|L1],[Y*VY|L2]):-
    VX>VY,!,
    bchange([X*VX|L1],L2).
bchange([X|L1],[X|L2]):-bchange(L1,L2).

next_population(Pop, Children, NextPop):-
    append(Pop, Children, Combined0),
    remove_duplicates(Combined0, Combined1),
    order_population(Combined1, Sorted),
    population(N),
    EliteFraction = 0.3,
    EliteCount0 is round(N * EliteFraction),
    (EliteCount0 < 1 -> EliteCount = 1 ; EliteCount = EliteCount0),
    split_elite(Sorted, EliteCount, Elite, Rest),
    roulette_select(Rest, N, EliteCount, SelectedRest),
    append(Elite, SelectedRest, NextPop).

remove_duplicates(List, NoDup) :-
    remove_duplicates(List, [], NoDup).

remove_duplicates([], _, []).
remove_duplicates([Ind*V | R], Seen, Out) :-
    ( member(Ind, Seen) -> remove_duplicates(R, Seen, Out); Out = [Ind*V | R2], remove_duplicates(R, [Ind|Seen], R2)).

split_elite(List, N, Elite, Rest) :-
    length(Elite, N),
    append(Elite, Rest, List).

roulette_select(Rest, PopSize, EliteCount, Selected) :-
    Remaining is PopSize - EliteCount,
    (Remaining =< 0 -> Selected = [] ;
        weight_random(Rest, Weighted),
        sort(Weighted, Sorted),
        take_first(Remaining, Sorted, FirstK),
        strip_pairs(FirstK, Selected)
    ).

take_first(0, _, []) :- !.
take_first(_, [], []) :- !.
take_first(N, [X|R], [X|R2]) :-
    N1 is N - 1,
    take_first(N1, R, R2).

strip_pairs([], []).
strip_pairs([_-(Ind*V) | R], [Ind*V | R2]) :-
    strip_pairs(R, R2).

weight_random([], []).
weight_random([Ind*V | R], [Prod-(Ind*V) | R2]) :-
    random(0.0,1.0,Rnd),
    Prod is V * Rnd,
    weight_random(R, R2).

generate_generation_single(_,_,[],_,_,_) :- !, fail.

generate_generation_single(G,G,[Best|_],_,_,Best):-!.

generate_generation_single(_,_,[Best|_],_,_,Best) :-
    start_time(Start),
    get_time(Now),
    time_limit(TL),
    TL > -1,
    Now - Start >= TL, !.

generate_generation_single(_,_,Pop,StableCount,PrevBest,Best) :-
    Pop = [Best|_],
    Best = _*BestVal,
    stable_limit(SL),
    SL > 0,
    (PrevBest == none -> NewStable = 0;BestVal =:= PrevBest -> NewStable is StableCount + 1; NewStable = 0),
    NewStable >= SL, !.

generate_generation_single(N,G,Pop,StableCount,PrevBest,BestOut):-
    Pop = [_*BestVal | _],
    (PrevBest == none -> NewStable = 0;BestVal =:= PrevBest -> NewStable is StableCount + 1; NewStable = 0),
    random_permutation(Pop, ShuffledPop),
    crossover(ShuffledPop,NPop1),
    mutation(NPop1,NPop),
    evaluate_population_single(NPop,NPopValue),
    next_population(Pop,NPopValue, NextPop),
    order_population(NextPop, OrderedNext),
    N1 is N+1,
    generate_generation_single(N1,G,OrderedNext, NewStable, BestVal, BestOut).

generate_crossover_points(P1,P2):- generate_crossover_points1(P1,P2).

generate_crossover_points1(P1,P2):-
    vessels(N),
    NTemp is N+1,
    random(1,NTemp,P11),
    random(1,NTemp,P21),
    P11\==P21,!,
    ((P11<P21,!,P1=P11,P2=P21);P1=P21,P2=P11).
generate_crossover_points1(P1,P2):-
    generate_crossover_points1(P1,P2).

crossover([ ],[ ]).
crossover([Ind*_],[Ind]).
crossover([Ind1*_,Ind2*_|Rest],[NInd1,NInd2|Rest1]):-
    generate_crossover_points(P1,P2),
    prob_crossover(Pcruz),random(0.0,1.0,Pc),
    ((Pc =< Pcruz,!,
        cross(Ind1,Ind2,P1,P2,NInd1),
        cross(Ind2,Ind1,P1,P2,NInd2))
    ;
    (NInd1=Ind1,NInd2=Ind2)),
    crossover(Rest,Rest1).

fillh([ ],[ ]).
fillh([_|R1],[h|R2]):-
    fillh(R1,R2).

sublist(L1,I1,I2,L):-I1 < I2,!,
    sublist1(L1,I1,I2,L).
sublist(L1,I1,I2,L):-sublist1(L1,I2,I1,L).

sublist1([X|R1],1,1,[X|H]):-!, fillh(R1,H).
sublist1([X|R1],1,N2,[X|R2]):-!,N3 is N2 - 1,
    sublist1(R1,1,N3,R2).
sublist1([_|R1],N1,N2,[h|R2]):-N3 is N1 - 1,
    N4 is N2 - 1,
    sublist1(R1,N3,N4,R2).

rotate_right(L,K,L1):- vessels(N),
    T is N - K,
    rr(T,L,L1).

rr(0,L,L):-!.
rr(N,[X|R],R2):- N1 is N - 1,
    append(R,[X],R1),
    rr(N1,R1,R2).

remove_list([],_,[]):-!.
remove_list([X|R1],L,[X|R2]):- not(member(X,L)),!,
    remove_list(R1,L,R2).
remove_list([_|R1],L,R2):-
    remove_list(R1,L,R2).

insert([],L,_,L):-!.
insert([X|R],L,N,L2):-
    vessels(T),
    ((N>T,!,N1 is N mod T);N1 = N),
    insert1(X,N1,L,L1),
    N2 is N + 1,
    insert(R,L1,N2,L2).

insert1(X,1,L,[X|L]):-!.
insert1(X,N,[Y|L],[Y|L1]):-
    N1 is N-1,
    insert1(X,N1,L,L1).

cross(Ind1,Ind2,P1,P2,NInd11):-
    sublist(Ind1,P1,P2,Sub1),
    vessels(NumT),
    R is NumT-P2,
    rotate_right(Ind2,R,Ind21),
    remove_list(Ind21,Sub1,Sub2),
    P3 is P2 + 1,
    insert(Sub2,Sub1,P3,NInd1),
    removeh(NInd1,NInd11).

removeh([],[]).
removeh([h|R1],R2):-!,
    removeh(R1,R2).
removeh([X|R1],[X|R2]):-
    removeh(R1,R2).

mutation([],[]).
mutation([Ind|Rest],[NInd|Rest1]):-
    prob_mutation(Pmut),
    random(0.0,1.0,Pm),
    ((Pm < Pmut,!,mutacao1(Ind,NInd));NInd = Ind),
    mutation(Rest,Rest1).

mutacao1(Ind,NInd):-
    generate_crossover_points(P1,P2),
    mutacao22(Ind,P1,P2,NInd).

mutacao22([G1|Ind],1,P2,[G2|NInd]):-
    !, P21 is P2-1,
    mutacao23(G1,P21,Ind,G2,NInd).
mutacao22([G|Ind],P1,P2,[G|NInd]):-
    P11 is P1-1, P21 is P2-1,
    mutacao22(Ind,P11,P21,NInd).

mutacao23(G1,1,[G2|Ind],G2,[G1|Ind]):-!.
mutacao23(G1,P,[G|Ind],G2,[G|NInd]):-
    P1 is P-1,
    mutacao23(G1,P1,Ind,G2,NInd).

return_best_solution_single(Seq*Delay, Result) :-
    sequence_temporization_single(Seq, Triplets),
    start_time(Ti), get_time(Tf),
    ExecTime is Tf - Ti,
    Result = result{
        best_sequence: Seq,
        best_delay: Delay,
        triplets: Triplets,
        execution_time: ExecTime
    }.

% ---------------- Multi-crane genetic algorithm ----------------

% Main entry point for multi-crane with automatic decision
generate_multi(Result) :-
    get_time(Start),
    asserta(start_time(Start)),
    
    % First, get best single-crane solution
    generate_population(Pop),
    evaluate_population_single(Pop, PopValue),
    order_population(PopValue, PopOrd),
    generations(NG),
    generate_generation_single(0, NG, PopOrd, 0, none, BestSingle),
    BestSingle = SeqSingle*DelaySingle,
    
    % Check if multi-crane is needed
    findall(M, vessel(_, _, _, _, M), Ms),
    max_list(Ms, MaxCraneAllowed),
    
    ( MaxCraneAllowed =< 1 ->
        % All vessels allow only 1 crane
        safe_log_genetic('All vessels allow only 1 crane; returning single-crane solution.~n', []),
        return_best_solution_single(BestSingle, Result)
    ; DelaySingle =:= 0 ->
        % Single-crane already optimal
        safe_log_genetic('Single-crane solution without delays.~n', []),
        return_best_solution_single(BestSingle, Result)
    ;
        % Apply multi-crane optimization
        safe_log_genetic('Applying multi-crane optimization...~n', []),
        sequence_temporization_single(SeqSingle, SeqTriplets),
        apply_multi_cranes_genetic(SeqTriplets, SeqQuad, DelayBest, CranesAlloc),
        start_time(Ti), get_time(Tf),
        ExecTime is Tf - Ti,
        Result = result{
            best_sequence: SeqSingle,
            best_delay: DelayBest,
            triplets: SeqQuad,
            cranes_alloc: CranesAlloc,
            execution_time: ExecTime
        }
    ).

% Apply multi-crane allocation to the best sequence
apply_multi_cranes_genetic(SeqTriplets, SeqQuad, DelayBest, CranesAlloc) :-
    findall(M, vessel(_, _, _, _, M), Ms),
    max_list(Ms, MaxCrane),
    loop_try_N_genetic(1, MaxCrane, SeqTriplets, SeqQuad, DelayBest, CranesAlloc).

% Build allocation for N cranes
build_alloc_for_N_genetic([], _N, []).
build_alloc_for_N_genetic([(ID, _, _, _)|T], N, [A|AT]) :-
    vessel(ID, _, _, _, MaxC),
    (N =< MaxC -> A = N ; A = MaxC),
    build_alloc_for_N_genetic(T, N, AT).

% Loop to try different crane allocations
loop_try_N_genetic(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_genetic(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_genetic(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_genetic(SeqQuad, DelayRaw),
    DelayRaw < 0,
    BestSeq = SeqQuad, BestDelay = 0, BestAlloc = Alloc.

loop_try_N_genetic(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_genetic(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_genetic(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_genetic(SeqQuad, DelayRaw),
    DelayRaw =:= 0,
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

loop_try_N_genetic(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN < MaxN,
    build_alloc_for_N_genetic(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_genetic(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_genetic(SeqQuad, DelayRaw),
    Next is CurrN + 1,
    loop_try_N_genetic(Next, MaxN, SeqTriplets, SeqQuadNext, DelayNext, AllocNext),
    ( DelayRaw =< DelayNext -> BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc ; BestSeq = SeqQuadNext, BestDelay = DelayNext, BestAlloc = AllocNext ).

loop_try_N_genetic(CurrN, MaxN, SeqTriplets, BestSeq, BestDelay, BestAlloc) :-
    CurrN =< MaxN,
    build_alloc_for_N_genetic(SeqTriplets, CurrN, Alloc),
    sequence_temporization_multi_genetic(SeqTriplets, Alloc, SeqQuad),
    sum_delays_multi_genetic(SeqQuad, DelayRaw),
    BestSeq = SeqQuad, BestDelay = DelayRaw, BestAlloc = Alloc.

% Sequence temporization with multi-crane
sequence_temporization_multi_genetic([], [], []).
sequence_temporization_multi_genetic([(V, TIn, _TEnd, _ExecBase)|VTs], [N|NCs], [(V, TInUnload, TEndLoad, ExecTime, N)|SeqQuad]) :-
    vessel(V, ProcessTime, _, _, _),
    ExecTimeRaw is (ProcessTime + N - 1) // N,
    (ExecTimeRaw < 1 -> ExecTime = 1 ; ExecTime = ExecTimeRaw),
    TInUnload is TIn,
    TEndLoad is TInUnload + ExecTime - 1,
    sequence_temporization_multi_genetic(VTs, NCs, SeqQuad).

% Sum delays for multi-crane
sum_delays_multi_genetic([], 0).
sum_delays_multi_genetic([(V, _, TEndLoad, _ExecTime, _NC)|LV], S) :-
    vessel(V, _, _, TDep, _),
    TPossibleDep is TEndLoad + 1,
    (TPossibleDep > TDep -> SV is TPossibleDep - TDep ; SV = 0),
    sum_delays_multi_genetic(LV, SLV),
    S is SV + SLV.

% ---------------- Test predicates ----------------

run_test_single_genetic :-
    % Initialize parameters if not already set
    (generations(_) -> true ; initialize_params(100, 20, 80, 10, 0, -1)),
    generate_single(Result),
    safe_log_genetic('Single-crane genetic result: ~w~n', [Result]).

run_test_multi_genetic :-
    % Initialize parameters if not already set
    (generations(_) -> true ; initialize_params(100, 20, 80, 10, 0, -1)),
    generate_multi(Result),
    safe_log_genetic('Multi-crane genetic result: ~w~n', [Result]).

run_all_tests_genetic :-
    safe_log_genetic('--- Global Test for Genetic Algorithm ---~n', []),
    
    % Initialize parameters: 100 generations, population 20, crossover 80%, mutation 10%
    initialize_params(100, 20, 80, 10, 0, -1),
    
    safe_log_genetic('Running single-crane genetic test...~n', []),
    generate_single(ResultSingle),
    safe_log_genetic('Single-crane result: ~w~n', [ResultSingle]),
    
    safe_log_genetic('Running multi-crane genetic test...~n', []),
    generate_multi(ResultMulti),
    safe_log_genetic('Multi-crane result: ~w~n', [ResultMulti]),
    
    safe_log_genetic('--- End of genetic algorithm test ---~n', []).
