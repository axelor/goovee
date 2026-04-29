'use client';

import {useState, useRef} from 'react';
import {MdAdd, MdDelete, MdUploadFile, MdImage} from 'react-icons/md';
import {HiOutlineCheckCircle} from 'react-icons/hi';

import {cn} from '@/utils/css';
import type {MarketplaceCategory, VersionDraftRow} from '../../../types';

type SellerProductFormProps = {
  categories: MarketplaceCategory[];
  workspaceURI: string;
  /** Populated when editing an existing product */
  initialValues?: {
    name?: string;
    description?: string;
    longDescription?: string;
    salePrice?: number;
    categoryIds?: string[];
    versions?: VersionDraftRow[];
  };
  onSubmit?: (data: FormData, status: 'draft' | 'submitted') => Promise<void>;
};

function makeVersionRow(): VersionDraftRow {
  return {
    _key: Math.random().toString(36).slice(2),
    version: '',
    releaseNotes: '',
    releaseDate: '',
    isLatest: false,
    file: null,
    fileName: '',
  };
}

export function SellerProductForm({
  categories,
  workspaceURI,
  initialValues,
  onSubmit,
}: SellerProductFormProps) {
  const [isFree, setIsFree] = useState((initialValues?.salePrice ?? 0) === 0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialValues?.categoryIds ?? [],
  );
  const [versions, setVersions] = useState<VersionDraftRow[]>(
    initialValues?.versions?.length
      ? initialValues.versions
      : [makeVersionRow()],
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'draft' | 'submitted' | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  const addVersion = () => setVersions(v => [...v, makeVersionRow()]);

  const removeVersion = (key: string) =>
    setVersions(v => v.filter(r => r._key !== key));

  const updateVersion = (key: string, field: keyof VersionDraftRow, value: unknown) =>
    setVersions(v =>
      v.map(r => {
        if (r._key !== key) return r;
        if (field === 'isLatest') {
          // only one can be latest
          return {...r, isLatest: true};
        }
        return {...r, [field]: value};
      }).map(r => {
        // if isLatest was set on this row, clear others
        if (field === 'isLatest' && value === true && r._key !== key) {
          return {...r, isLatest: false};
        }
        return r;
      }),
    );

  const handleVersionFile = (key: string, file: File | null) => {
    setVersions(v =>
      v.map(r =>
        r._key === key ? {...r, file, fileName: file?.name ?? ''} : r,
      ),
    );
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    setSubmitting(status);
    const fd = new FormData();
    fd.set('marketplaceStatusSelect', status);
    fd.set('isFree', String(isFree));
    selectedCategories.forEach(id => fd.append('categoryIds', id));
    versions.forEach((v, i) => {
      fd.set(`versions[${i}][version]`, v.version);
      fd.set(`versions[${i}][releaseNotes]`, v.releaseNotes);
      fd.set(`versions[${i}][releaseDate]`, v.releaseDate);
      fd.set(`versions[${i}][isLatest]`, String(v.isLatest));
      if (v.file) fd.set(`versions[${i}][file]`, v.file);
    });
    if (coverRef.current?.files?.[0]) fd.set('picture', coverRef.current.files[0]);
    try {
      await onSubmit?.(fd, status);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Section 1 — Basic Info */}
      <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-base">Basic information</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            name="name"
            defaultValue={initialValues?.name}
            placeholder="e.g. Axelor CRM Connector"
            className="px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Categories <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full border font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground hover:bg-muted',
                  )}>
                  {active && <HiOutlineCheckCircle className="inline mr-1" />}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Short description</label>
          <textarea
            name="description"
            defaultValue={initialValues?.description}
            rows={2}
            placeholder="One-line summary shown on product cards"
            className="px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Full description</label>
          <textarea
            name="longDescription"
            defaultValue={initialValues?.longDescription}
            rows={6}
            placeholder="Detailed description shown on the product detail page (HTML supported)"
            className="px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
      </section>

      {/* Section 2 — Pricing */}
      <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-base">Pricing</h2>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={isFree}
            onChange={e => setIsFree(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm">This product is free</span>
        </label>

        {!isFree && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Price <span className="text-destructive">*</span>
            </label>
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
              <input
                name="salePrice"
                type="number"
                min={0}
                step={0.01}
                defaultValue={initialValues?.salePrice}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </section>

      {/* Section 3 — Media */}
      <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-base">Cover image</h2>

        <div
          className="relative w-full h-48 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
          onClick={() => coverRef.current?.click()}>
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <MdImage className="text-3xl text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload cover image
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </>
          )}
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>
      </section>

      {/* Section 4 — Versions */}
      <section className="bg-card rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">
            Software versions{' '}
            <span className="text-destructive">*</span>
          </h2>
          <button
            type="button"
            onClick={addVersion}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
            <MdAdd />
            Add version
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {versions.map((row, idx) => (
            <VersionRow
              key={row._key}
              row={row}
              index={idx}
              isOnly={versions.length === 1}
              onChange={(field, value) => updateVersion(row._key, field, value)}
              onFileChange={file => handleVersionFile(row._key, file)}
              onRemove={() => removeVersion(row._key)}
              onSetLatest={() => updateVersion(row._key, 'isLatest', true)}
            />
          ))}
        </div>
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <a
          href={`${workspaceURI}/market-place/my-products`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </a>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!!submitting}
            onClick={() => handleSubmit('draft')}
            className="px-5 py-2.5 text-sm font-medium rounded-xl border hover:bg-muted transition-colors disabled:opacity-50">
            {submitting === 'draft' ? 'Saving...' : 'Save as draft'}
          </button>
          <button
            type="button"
            disabled={!!submitting}
            onClick={() => handleSubmit('submitted')}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {submitting === 'submitted' ? 'Submitting...' : 'Submit for review'}
          </button>
        </div>
      </div>
    </div>
  );
}

type VersionRowProps = {
  row: VersionDraftRow;
  index: number;
  isOnly: boolean;
  onChange: (field: keyof VersionDraftRow, value: unknown) => void;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  onSetLatest: () => void;
};

function VersionRow({
  row,
  index,
  isOnly,
  onChange,
  onFileChange,
  onRemove,
  onSetLatest,
}: VersionRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-3 relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Version {index + 1}
        </span>
        {!isOnly && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors">
            <MdDelete className="text-base" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">
            Version string <span className="text-destructive">*</span>
          </label>
          <input
            value={row.version}
            onChange={e => onChange('version', e.target.value)}
            placeholder="e.g. 1.0.0"
            className="px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Release date</label>
          <input
            type="date"
            value={row.releaseDate}
            onChange={e => onChange('releaseDate', e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Release notes</label>
        <textarea
          value={row.releaseNotes}
          onChange={e => onChange('releaseNotes', e.target.value)}
          rows={2}
          placeholder="What changed in this version?"
          className="px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* File upload */}
      <div
        className="flex items-center gap-3 border border-dashed rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => fileRef.current?.click()}>
        <MdUploadFile className="text-xl text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {row.fileName || 'Upload software file'}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.fileName ? 'Click to change file' : 'ZIP, EXE, DMG, JAR, etc.'}
          </p>
        </div>
        {row.fileName && (
          <span className="text-xs text-green-600 font-medium shrink-0">✓ Ready</span>
        )}
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={e => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Mark as latest */}
      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={row.isLatest}
          onChange={e => e.target.checked && onSetLatest()}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-xs text-muted-foreground">
          Mark as latest version
        </span>
      </label>
    </div>
  );
}

export default SellerProductForm;
