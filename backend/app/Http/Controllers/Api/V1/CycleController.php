<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller; use App\Http\Requests\CycleRequest; use App\Models\Cycle; use App\Services\PhaseThreeService;
use Illuminate\Http\Request;

class CycleController extends Controller {
 public function index(Request $r){
    $q = Cycle::latest('start_date');
    if ($search = $r->query('search')) {
        $q->where('name', 'like', "%{$search}%");
    }
    if ($status = $r->query('status')) {
        $q->where('status', $status);
    }
    return response()->json(['success'=>true,'data'=>$q->paginate((int)($r->query('per_page', 25)))]);
 }
 public function store(CycleRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->cycle($r->validated())],201);}
 public function show(Cycle $cycle){return response()->json(['success'=>true,'data'=>$cycle->load('weights')]);}
 public function update(CycleRequest $r,Cycle $cycle,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->cycle($r->validated(),$cycle)]);}
 public function destroy(Cycle $cycle,PhaseThreeService $s){$s->delete($cycle);return response()->json(['success'=>true]);}
}
