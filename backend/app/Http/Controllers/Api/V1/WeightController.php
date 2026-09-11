<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller; use App\Http\Requests\WeightRequest; use App\Models\Weight; use App\Services\PhaseThreeService;
class WeightController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>Weight::with('cycle')->latest('recorded_date')->paginate(25)]);}
 public function store(WeightRequest $r,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->weight($r->validated())],201);}
 public function show(Weight $weight){return response()->json(['success'=>true,'data'=>$weight->load('cycle')]);}
 public function update(WeightRequest $r,Weight $weight,PhaseThreeService $s){return response()->json(['success'=>true,'data'=>$s->weight($r->validated(),$weight)]);}
 public function destroy(Weight $weight,PhaseThreeService $s){$s->delete($weight);return response()->json(['success'=>true]);}
}
