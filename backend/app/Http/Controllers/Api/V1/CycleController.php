<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller; use App\Http\Requests\CycleRequest; use App\Models\Cycle; use App\Services\PhaseThreeService;
class CycleController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>Cycle::latest('start_date')->paginate(25)]);}
 public function store(CycleRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->cycle($r->validated())],201);}
 public function show(Cycle $cycle){return response()->json(['success'=>true,'data'=>$cycle->load('weights')]);}
 public function update(CycleRequest $r,Cycle $cycle,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->cycle($r->validated(),$cycle)]);}
 public function destroy(Cycle $cycle,PhaseThreeService $s){$s->delete($cycle);return response()->json(['success'=>true]);}
}
