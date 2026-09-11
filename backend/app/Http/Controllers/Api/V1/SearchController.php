<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request, SearchService $search)
    {
        $validated = $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);
        $results = $search->search($validated['q']);

        return response()->json([
            'success' => true,
            'query' => $validated['q'],
            'data' => $results,
            'total' => count($results),
        ]);
    }
}
