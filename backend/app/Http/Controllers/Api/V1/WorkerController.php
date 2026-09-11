<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Worker\WorkerRequest;
use App\Models\Worker;
use App\Services\WorkerService;

class WorkerController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Worker::withCount('payments')->latest()->paginate(25)]);
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
