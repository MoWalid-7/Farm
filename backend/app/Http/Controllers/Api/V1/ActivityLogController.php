<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user:id,name')->latest();
        $query->when($request->event, fn ($q, $event) => $q->where('event', $event));
        $query->when($request->subject_type, fn ($q, $type) => $q->where('subject_type', 'like', '%'.$type));

        return response()->json(['success' => true, 'data' => $query->paginate(25)]);
    }
}
