<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BackupRestoreRequest;
use App\Models\Backup;
use App\Services\ActivityLogService;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class BackupController extends Controller
{
    public function __construct(private readonly BackupService $service) {}

    public function index()
    {
        return response()->json(['success' => true, 'data' => Backup::latest('created_at')->paginate(25)]);
    }

    public function store(Request $request)
    {
        $backup = $this->service->create($request->user()->id);
        app(ActivityLogService::class)->record('created', $backup, null, $backup->getAttributes());

        return response()->json(['success' => true, 'data' => $backup], 201);
    }

    public function download(Backup $backup)
    {
        abort_unless(Storage::disk($backup->disk)->exists('backups/'.$backup->filename), 404);

        return Storage::disk($backup->disk)->download('backups/'.$backup->filename, $backup->filename, ['Content-Type' => 'application/json']);
    }

    public function restore(Backup $backup, Request $request)
    {
        try {
            $this->service->restore($this->service->read($backup));
        } catch (InvalidArgumentException|\JsonException $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }
        app(ActivityLogService::class)->record('restored', $backup, null, ['filename' => $backup->filename]);

        return response()->json(['success' => true, 'message' => 'Backup restored successfully.']);
    }

    public function uploadRestore(BackupRestoreRequest $request)
    {
        try {
            $payload = $this->service->readUpload($request->file('backup'));
            $this->service->restore($payload);
        } catch (InvalidArgumentException|\JsonException $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 422);
        }

        return response()->json(['success' => true, 'message' => 'Backup restored successfully.']);
    }
}
