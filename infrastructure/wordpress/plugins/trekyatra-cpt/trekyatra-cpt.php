<?php
/**
 * Plugin Name: TrekYatra CPT
 * Description: Registers custom post types and meta fields for TrekYatra content.
 * Version: 1.0.0
 * Author: TrekYatra
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ---------------------------------------------------------------------------
// Custom post types
// ---------------------------------------------------------------------------

$TREKYATRA_CPTS = [
    'trek_guide'       => [ 'Trek Guides',       'Trek Guide' ],
    'packing_list'     => [ 'Packing Lists',      'Packing List' ],
    'comparison'       => [ 'Comparisons',        'Comparison' ],
    'permit_guide'     => [ 'Permit Guides',      'Permit Guide' ],
    'seasonal_page'    => [ 'Seasonal Pages',     'Seasonal Page' ],
    'beginner_roundup' => [ 'Beginner Roundups',  'Beginner Roundup' ],
    'gear_review'      => [ 'Gear Reviews',       'Gear Review' ],
    'destination'      => [ 'Destinations',       'Destination' ],
];

add_action( 'init', function () use ( $TREKYATRA_CPTS ) {
    foreach ( $TREKYATRA_CPTS as $slug => [ $plural, $singular ] ) {
        register_post_type( $slug, [
            'labels'       => [
                'name'          => $plural,
                'singular_name' => $singular,
            ],
            'public'       => true,
            'show_in_rest' => true,
            'rest_base'    => $slug,
            'supports'     => [ 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ],
            'has_archive'  => true,
            'rewrite'      => [ 'slug' => str_replace( '_', '-', $slug ) ],
        ] );
    }
} );

// ---------------------------------------------------------------------------
// Custom meta fields (visible in WP REST API responses)
// ---------------------------------------------------------------------------

$TREKYATRA_META_FIELDS = [
    'content_type',
    'cluster_id',
    'brief_id',
    'freshness_interval',
    'monetization_type',
    'page_trust_level',
    'fact_check_status',
    'affiliate_disclosure_flag',
    'safety_disclaimer_flag',
    'schema_payload_ref',
];

add_action( 'init', function () use ( $TREKYATRA_META_FIELDS, $TREKYATRA_CPTS ) {
    $all_types = array_merge( [ 'post' ], array_keys( $TREKYATRA_CPTS ) );
    foreach ( $all_types as $post_type ) {
        foreach ( $TREKYATRA_META_FIELDS as $key ) {
            register_post_meta( $post_type, $key, [
                'show_in_rest' => true,
                'single'       => true,
                'type'         => 'string',
                'default'      => '',
            ] );
        }
    }
} );
