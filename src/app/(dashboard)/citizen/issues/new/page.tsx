
"use client";

import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Navigation,
  Upload,
  X,
  Camera,
  Search,
  LocateFixed,
  Map,
  Satellite,
  FileText,
  AlertCircle,
  ChevronDown,
  Loader2,
  Crosshair,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../../client/lib/api-client";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_CATEGORIES,
  type IssueCategory,
} from "../../../../../shared/constants/categories";
import type { IssuePriority } from "../../../../../shared/constants/priorities";

type CreateIssueResult = {
  issue: { id: string };
  possibleDuplicate: boolean;
};

type StoredImage = {
  url: string;
};

type LocationItem = {
  id: string;
  name: string;
  area: string;
  ward: string | null;
  address: string;
  latitude: number;
  longitude: number;
};

type LocationsResult = {
  items: LocationItem[];
};

const priorityLabels: Record<IssuePriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950";

const labelClass =
  "text-sm font-semibold text-slate-700 dark:text-slate-200";

export default function ReportIssuePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<IssueCategory>("ROAD_DAMAGE");
  const [priority, setPriority] =
    useState<IssuePriority>("MEDIUM");
  const [description, setDescription] = useState("");

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationId, setLocationId] = useState<string>();

  const [searchQuery, setSearchQuery] = useState("");
  const [presetLocations, setPresetLocations] =
    useState<LocationItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [searchingLocations, setSearchingLocations] =
    useState(false);

  const [mapStyle, setMapStyle] =
    useState<"street" | "satellite">("street");

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const lat = Number(latitude);
  const lng = Number(longitude);

  const validCoordinates =
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  // Load predefined locations
  useEffect(() => {
    let active = true;

    void apiClient
      .get<LocationsResult>("/api/locations?limit=50")
      .then((result) => {
        if (active) setPresetLocations(result.items);
      })
      .catch(() => {
        if (active) setPresetLocations([]);
      });

    return () => {
      active = false;
    };
  }, []);

  // Location autocomplete
  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      if (!searchQuery.trim() || locationId) {
        setLocations([]);
        setSearchingLocations(false);
        return;
      }

      setSearchingLocations(true);

      void apiClient
        .get<LocationsResult>(
          `/api/locations?limit=8&q=${encodeURIComponent(
            searchQuery.trim(),
          )}`,
        )
        .then((result) => {
          if (active) setLocations(result.items);
        })
        .catch(() => {
          if (active) setLocations([]);
        })
        .finally(() => {
          if (active) setSearchingLocations(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchQuery, locationId]);

  function selectLocation(location: LocationItem) {
    setLocationId(location.id);
    setSearchQuery(location.name);
    setAddress(location.address);
    setLatitude(location.latitude.toFixed(6));
    setLongitude(location.longitude.toFixed(6));
    setLocations([]);

    toast.success(`Location selected: ${location.name}`);
  }

  function addFiles(selected: FileList | null) {
    if (!selected) return;

    const available = Math.max(0, 10 - files.length);

    const next = Array.from(selected)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, available);

    if (next.length !== selected.length) {
      toast.error(
        "Only image files are allowed, with a maximum of 10.",
      );
    }

    setFiles((current) => [...current, ...next]);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function useGps() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationId(undefined);
        setSearchQuery("");
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);

        toast.success("Your location has been added.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to access your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validCoordinates) {
      toast.error("Enter valid latitude and longitude coordinates.");
      return;
    }

    if (title.trim().length < 5) {
      toast.error("Incident title must be at least 5 characters.");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const stored = await apiClient.postForm<StoredImage>(
          "/api/upload",
          formData,
        );

        imageUrls.push(stored.url);
      }

      const result = await apiClient.post<CreateIssueResult>(
        "/api/issues",
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          address: address.trim(),
          latitude: lat,
          longitude: lng,
          ...(locationId ? { locationId } : {}),
          imageUrls,
        },
      );

      toast.success(
        result.possibleDuplicate
          ? "Issue submitted. A possible duplicate was detected."
          : "Incident report submitted successfully.",
      );

      router.push("/citizen");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit the report.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-7 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1450px]">

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/citizen"
              aria-label="Back to overview"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-sky-400/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                  Citizen Portal
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Report Municipal {" "}
                <span className="font-serif italic text-sky-600 dark:text-sky-400">
                  Infrastructure Issue
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Help improve your community. Report infrastructure
                problems and share their exact location with the
                responsible department.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300 sm:flex">
              <CheckCircle2 className="h-4 w-4" />
              Official Report Form
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">

            {/* LEFT: Incident Information */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">

              <div className="border-b border-slate-100 px-5 py-5 dark:border-white/10 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Incident Information
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Step 01 · Tell us about the problem
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-7">

                {/* Title */}
                <div>
                  <label htmlFor="issue-title" className={labelClass}>
                    Incident Title{" "}
                    <span className="text-sky-500">*</span>
                  </label>

                  <input
                    className={inputClass}
                    id="issue-title"
                    maxLength={200}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Damaged road near Dhanmondi 27"
                    required
                    value={title}
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Give your report a short and clear title.
                  </p>
                </div>

                {/* Category and Priority */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="issue-category" className={labelClass}>
                      Sector / Category{" "}
                      <span className="text-sky-500">*</span>
                    </label>

                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        id="issue-category"
                        onChange={(event) =>
                          setCategory(
                            event.target.value as IssueCategory,
                          )
                        }
                        value={category}
                      >
                        {ISSUE_CATEGORIES.map((item) => (
                          <option key={item} value={item}>
                            {ISSUE_CATEGORY_LABELS[item]}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-6 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="issue-priority" className={labelClass}>
                      Perceived Severity{" "}
                      <span className="text-sky-500">*</span>
                    </label>

                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        id="issue-priority"
                        onChange={(event) =>
                          setPriority(
                            event.target.value as IssuePriority,
                          )
                        }
                        value={priority}
                      >
                        {(
                          ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IssuePriority[]
                        ).map((item) => (
                          <option key={item} value={item}>
                            {priorityLabels[item]}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-6 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="issue-description"
                      className={labelClass}
                    >
                      Detailed Description{" "}
                      <span className="text-sky-500">*</span>
                    </label>

                    <span className="text-xs text-slate-400">
                      {description.length}/5000
                    </span>
                  </div>

                  <textarea
                    className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950"
                    id="issue-description"
                    maxLength={5000}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Describe the problem in detail. Mention the damage, its severity, and any safety concerns..."
                    required
                    value={description}
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Minimum 10 characters. Please provide accurate
                    information.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="issue-address" className={labelClass}>
                      Street Address / Landmark{" "}
                      <span className="text-sky-500">*</span>
                    </label>

                    <span className="text-xs text-sky-600 dark:text-sky-400">
                      Auto-fill coordinates
                    </span>
                  </div>

                  {presetLocations.length > 0 && (
                    <div className="relative">
                      <MapPin className="absolute left-4 top-5 h-4 w-4 text-sky-500" />

                      <select
                        aria-label="Select predefined Dhaka location"
                        className={`${inputClass} appearance-none pl-11 pr-10`}
                        onChange={(event) => {
                          const chosen = presetLocations.find(
                            (loc) => loc.id === event.target.value,
                          );

                          if (chosen) {
                            selectLocation(chosen);
                          }
                        }}
                        value={locationId ?? ""}
                      >
                        <option value="">
                          Quick select a landmark or area
                        </option>

                        {presetLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} — {loc.area}
                            {loc.ward ? ` (${loc.ward})` : ""}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="pointer-events-none absolute right-4 top-6 h-4 w-4 text-slate-400" />
                    </div>
                  )}

                  <input
                    className={inputClass}
                    id="issue-address"
                    maxLength={500}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setLocationId(undefined);
                    }}
                    placeholder="Enter the exact street address or landmark..."
                    required
                    value={address}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className={labelClass}>
                      Photograph Evidence
                    </label>

                    <span className="text-xs font-medium text-slate-400">
                      {files.length}/10 images
                    </span>
                  </div>

                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    type="file"
                  />

                  <div
                    className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-center transition-all hover:border-sky-400 hover:bg-sky-50/60 dark:border-white/10 dark:bg-slate-950/40 dark:hover:border-sky-400/50 dark:hover:bg-sky-400/5"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {files.length === 0 ? (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition-transform group-hover:scale-110 dark:bg-sky-400/10 dark:text-sky-400">
                          <Camera className="h-7 w-7" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                          Drag and drop your photos here
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Or click to browse from your device
                        </p>

                        <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600">
                          <Upload className="h-4 w-4" />
                          Browse Files
                        </span>

                        <p className="mt-3 text-[11px] text-slate-400">
                          PNG, JPG, JPEG or WebP · Maximum 10 images
                        </p>
                      </>
                    ) : (
                      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                        {files.map((file, index) => (
                          <div
                            className="relative h-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"
                            key={`${file.name}-${index}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={file.name}
                              className="h-full w-full object-cover"
                              src={previewUrls[index]}
                            />

                            <button
                              aria-label="Remove image"
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-white shadow-md transition hover:bg-red-500"
                              onClick={(event) => {
                                event.stopPropagation();
                                setFiles((current) =>
                                  current.filter(
                                    (_, itemIndex) =>
                                      itemIndex !== index,
                                  ),
                                );
                              }}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        {files.length < 10 && (
                          <button
                            className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 text-sky-600 transition hover:bg-sky-50 dark:border-sky-400/30 dark:bg-sky-400/5 dark:text-sky-400"
                            onClick={(event) => {
                              event.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            type="button"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-xs font-bold">
                              Add More
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: Location */}
            <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">

              <div className="border-b border-slate-100 px-5 py-5 dark:border-white/10 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                    <Map className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Geolocation Pinpoint
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Step 02 · Pinpoint the exact location
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-7">

                {/* Search */}
                <div>
                  <label className={labelClass}>
                    Search Location
                  </label>

                  <div className="relative mt-2">
                    <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />

                    <input
                      className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-12 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:bg-slate-950"
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setLocationId(undefined);
                      }}
                      placeholder="Search area, road or landmark..."
                      value={searchQuery}
                    />

                    {searchingLocations && (
                      <Loader2 className="absolute right-4 top-4 h-5 w-5 animate-spin text-sky-500" />
                    )}

                    {!searchingLocations && searchQuery && (
                      <button
                        aria-label="Clear search"
                        className="absolute right-4 top-4 text-slate-400 transition hover:text-red-500"
                        onClick={() => {
                          setSearchQuery("");
                          setLocations([]);
                          setLocationId(undefined);
                        }}
                        type="button"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    {/* Autocomplete dropdown */}
                    {searchQuery.trim() &&
                      !locationId &&
                      (locations.length > 0 || searchingLocations) && (
                        <div className="absolute left-0 right-0 top-full z-[1000] mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-900">
                          {searchingLocations ? (
                            <div className="flex items-center gap-2 px-4 py-4 text-xs text-slate-500">
                              <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                              Searching locations...
                            </div>
                          ) : (
                            locations.map((location) => (
                              <button
                                className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-sky-50 dark:hover:bg-sky-400/10"
                                key={location.id}
                                onClick={() => selectLocation(location)}
                                type="button"
                              >
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                                  <MapPin className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {location.name}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {location.address}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Search and select a location to automatically
                    fill its coordinates.
                  </p>
                </div>

                {/* GPS Button */}
                <button
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 disabled:cursor-wait disabled:opacity-60 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/15"
                  disabled={locating}
                  onClick={useGps}
                  type="button"
                >
                  {locating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Crosshair className="h-5 w-5" />
                  )}

                  {locating
                    ? "Detecting your location..."
                    : "Use My Current Location"}
                </button>

                {/* Coordinates */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/50">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LocateFixed className="h-4 w-4 text-sky-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        GPS Coordinates
                      </span>
                    </div>

                    {validCoordinates ? (
                      <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Valid
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">
                        Latitude
                      </label>

                      <input
                        aria-label="Latitude"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        inputMode="decimal"
                        onChange={(event) => {
                          setLatitude(event.target.value);
                          setLocationId(undefined);
                        }}
                        placeholder="23.8103"
                        value={latitude}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">
                        Longitude
                      </label>

                      <input
                        aria-label="Longitude"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-sky-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        inputMode="decimal"
                        onChange={(event) => {
                          setLongitude(event.target.value);
                          setLocationId(undefined);
                        }}
                        placeholder="90.4125"
                        value={longitude}
                      />
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        Location Preview
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        View your selected location on the map
                      </p>
                    </div>

                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950">
                      <button
                        aria-label="Street map"
                        className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-bold transition ${
                          mapStyle === "street"
                            ? "bg-sky-500 text-white shadow-sm dark:bg-sky-400 dark:text-slate-950"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        }`}
                        onClick={() => setMapStyle("street")}
                        type="button"
                      >
                        <Map className="h-3.5 w-3.5" />
                        Street
                      </button>

                      <button
                        aria-label="Satellite map"
                        className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-bold transition ${
                          mapStyle === "satellite"
                            ? "bg-sky-500 text-white shadow-sm dark:bg-sky-400 dark:text-slate-950"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        }`}
                        onClick={() => setMapStyle("satellite")}
                        type="button"
                      >
                        <Satellite className="h-3.5 w-3.5" />
                        Satellite
                      </button>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
                    <div className="h-[330px] w-full sm:h-[400px]">
                      <iframe
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={
                          validCoordinates
                            ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed&maptype=${
                                mapStyle === "satellite"
                                  ? "satellite"
                                  : "roadmap"
                              }`
                            : `https://www.google.com/maps?q=Dhaka,Bangladesh&z=12&output=embed&maptype=roadmap`
                        }
                        title="Issue location map"
                      />
                    </div>

                    {!validCoordinates && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                        <AlertCircle className="h-4 w-4 shrink-0 text-sky-500" />
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          Select a location or use GPS to view the
                          exact position.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    <p>
                      Use GPS or enter the exact coordinates for the
                      incident location. Make sure the location is
                      accurate before submitting.
                    </p>
                  </div>
                </div>

                {/* Location status */}
                {validCoordinates && (
                  <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-400/20 dark:bg-sky-400/5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-sky-800 dark:text-sky-300">
                        Coordinates are ready
                      </p>
                      <p className="mt-0.5 text-[11px] text-sky-700/70 dark:text-sky-300/70">
                        Your incident location is ready to submit.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* Submit Footer */}
          <div className="sticky bottom-0 z-20 mt-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
                  <AlertCircle className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    Ready to submit your report?
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Please review your information before submitting.
                  </p>
                </div>
              </div>

              <div className="flex w-full gap-3 sm:w-auto">
                <Link
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-white/5 sm:flex-none"
                  href="/citizen"
                >
                  Cancel
                </Link>

                <button
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-7 text-sm font-extrabold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300 sm:flex-none"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Incident Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Bottom note */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Your report helps make our community safer and better.
        </p>
      </div>
    </div>
  );
}
