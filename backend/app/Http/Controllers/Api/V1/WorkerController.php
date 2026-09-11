<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Worker\WorkerRequest;
use App\Models\Worker;
use App\Services\WorkerService;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    public function index(Request $r)
    {
        $q = Worker::withCount('payments')->withSum('payments','amount')->latest();
        if ($search = $r->query('search')) {
            $q->where(function($q2) use ($search) {
                $q2->where('name','like',"%{$search}%")
                   ->orWhere('phone','like',"%{$search}%")
                   ->orWhere('job_title','like',"%{$search}%");
            });
        }
        if ($status = $r->query('status')) $q->where('status',$status);
        return response()->json(['success' => true, 'data' => $q->paginate((int)($r->query('per_page',25)))]);
    }

    public function store(WorkerRequest $request, WorkerService $service)
    {
        return response()->json(['success' => true, 'data' => $service->create($request->validated())], 201);
    }

    public function show(Worker $worker)
    {
        return response()->json(['success' => true, 'data' => $worker->load('payments')]);
    }

    public function update(WorkerRequest $request, Worker $worker, WorkerService $service)
    {
        return response()->json(['success' => true, 'data' => $service->update($worker, $request->validated())]);
    }

    public function destroy(Worker $worker, WorkerService $service)
    {
        $service->delete($worker);

        return response()->json(['success' => true]);
    }
}
